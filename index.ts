import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as mysql from "@pulumi/mysql";
import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

const config = new pulumi.Config();
export const dbUsername = config.get("dbUsername") || "my-user";

const vpc = new awsx.ec2.Vpc("main");

const dbSecurityGroup = new aws.ec2.SecurityGroup("db", {
    vpcId: vpc.vpc.id,
    ingress: [
        { protocol: "tcp", fromPort: 3306, toPort: 3306, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

const dbSubnets = new aws.rds.SubnetGroup("db", {
    subnetIds: vpc.publicSubnetIds,
});

const adminPassword = new random.RandomPassword("db", {
    length: 20,
}, {
    // until https://github.com/pulumi/pulumi-terraform-bridge/issues/10
    additionalSecretOutputs: ["result"],
});

const db = new aws.rds.Instance("db", {
    name: "demo",

    engine: "mysql",

    instanceClass: "db.t2.micro",
    allocatedStorage: 20,

    dbSubnetGroupName: dbSubnets.id,
    vpcSecurityGroupIds: [dbSecurityGroup.id],
    publiclyAccessible: true,

    username: "admin",
    password: adminPassword.result,

    skipFinalSnapshot: true,
});

export const dbAddress = db.address;

const mysqlProvider = new mysql.Provider("db", {
    endpoint: db.endpoint,
    username: db.username,
    password: adminPassword.result,
});

const mysqlUserPassword = new random.RandomPassword("user", {
    length: 20,
}, {
    // until https://github.com/pulumi/pulumi-terraform-bridge/issues/10
    // additionalSecretOutputs: ["result"],
});

const mysqlUser = new mysql.User("db", {
    host: "%",
    user: dbUsername,
    plaintextPassword: mysqlUserPassword.result,
}, { provider: mysqlProvider });

export const dbPassword = mysqlUserPassword.result;
