# pulumi-rds-mysql

A [Pulumi](https://www.pulumi.com/) application to create a MySQL RDS database instance 
and a MySQL user named `my-user` (by default).

## Usage

To create the database and MySQL user:
```
pulumi config set aws:region us-west-2
pulumi up
```

To customize the name of the MySQL user:
```
pulumi config set dbUsername clstokes
```

To test connectivity:
```
docker run -it --rm mysql mysql -h$(pulumi stack output dbAddress) -u$(pulumi stack output dbUsername) -p$(pulumi stack output dbPassword)
```
