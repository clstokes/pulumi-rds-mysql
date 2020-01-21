import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as mysql from "@pulumi/mysql";
import * as random from "@pulumi/random";

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

const dbPassword = new random.RandomPassword("db", {
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
    password: dbPassword.result,

    skipFinalSnapshot: true,
});

const mysqlProvider = new mysql.Provider("db", {
    endpoint: db.endpoint,
    username: db.username,
    password: dbPassword.result,
});

const mysqlUserPassword = new random.RandomPassword("user", {
    length: 20,
}, {
    // until https://github.com/pulumi/pulumi-terraform-bridge/issues/10
    // additionalSecretOutputs: ["result"],
});

const mysqlUser = new mysql.User("db", {
    host: "%",
    user: "cameron",
    plaintextPassword: mysqlUserPassword.result,
}, { provider: mysqlProvider });

export const userPassword = mysqlUserPassword.result;
