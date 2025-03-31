import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {
    CfnThingGroup,
} from 'aws-cdk-lib/aws-iot';

import { GreengrassFleetProvisioning } from 'cdk-iot-greengrass-fleet-provisioning';

export interface BigaIoTResourcesProps extends cdk.StackProps {
    resource_prefix: string,
    certificateBucket: s3.Bucket,
    certificatePrefix: string;
    thingGroupName: string;
}

export class BigaIoTResourcesStack extends cdk.Stack {
    public readonly certificateId: string;
    public readonly certificateArn: string;
    public readonly certificateBucket: s3.Bucket;
    public readonly certificatePrefix: string;
    public readonly thingGroup: cdk.aws_iot.CfnThingGroup;
    public readonly region: string;
    public readonly roleAlias: string;
    public readonly iotDataEndpoint: string;
    public readonly iotCredentialEndpoint: string;

    constructor(scope: Construct, id: string, props: BigaIoTResourcesProps) {
        super(scope, id, props);

        this.certificateBucket = props.certificateBucket;
        this.certificatePrefix = props.certificatePrefix;

        this.thingGroup = new CfnThingGroup(this, `${props.resource_prefix}-thing-group`, {
            thingGroupName: props.thingGroupName,
        });

        const cn: GreengrassFleetProvisioning = new GreengrassFleetProvisioning(this, `${props.resource_prefix}-greengrass-fleet-provisioning`, {
            env: props.env!,
            resourcePrefix: props.resource_prefix,
            certificateBucket: this.certificateBucket,
            certificatePrefix: this.certificatePrefix,
        });

        this.certificateId = cn.certificateId;
        this.certificateArn = cn.certificateArn;

        this.region = props.env!.region!;
        this.roleAlias = cn.tokenExchangeRoleAlias.roleAlias!;
        this.iotDataEndpoint = cn.dataEndpoint;
        this.iotCredentialEndpoint = cn.credentialEndpoint;
    }
}
