#!/usr/bin/env node
import path = require("path");

import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codebuild from "aws-cdk-lib/aws-codebuild";

import {
  EmbeddedLinuxCodePipelineBaseImageStack,
  EmbeddedLinuxCodePipelineStack,
  PipelineResourcesStack,
  ProjectType,
} from "aws4embeddedlinux-cdk-lib";
import { BigaIoTResourcesStack } from "../lib/biga-iot-resources";

const resource_prefix = "biga-ci";

const app = new cdk.App();

/* See https://docs.aws.amazon.com/sdkref/latest/guide/access.html for details on how to access AWS. */
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_DEFAULT_REGION,
};

/**
 * Use these default props to enable termination protection and tag related AWS
 * Resources for tracking purposes.
 */
const defaultProps: cdk.StackProps = {
  tags: { PURPOSE: "META-AWS-BUILD" },
  terminationProtection: false, // TODO: enable or remove.
  env,
};

/**
 * Set up networking and other reources to allow us to securely attach EFS to our CodeBuild instances.
 * Set up the Certificate Stack that create the SSM Parameters, Thing Group and associate the certificate with it
 * Set up the Stacks that Bootstrap Greengrass for the fleet provisioning.
 */
const pipelineResourcesStack = new PipelineResourcesStack(
  app,
  `${resource_prefix}-pipeline-resources`,
  {
    ...defaultProps,
    description: "AWS IoT Automotive Demo - Pipeline Resources Stack",
    resource_prefix: resource_prefix,
  }
);

const bigaIoTResourcesStack = new BigaIoTResourcesStack(
  app,
  `${resource_prefix}-certificate-resources`,
  {
    ...defaultProps,
    description: "AWS IoT Automotive Demo - Biga Resources Stack",
    resource_prefix: resource_prefix,
    certificateBucket: pipelineResourcesStack.pipelineSourceBucket,
    certificatePrefix: "certificates",
    thingGroupName: "EmbeddedLinuxFleet",
  }
);

const baseImageStack = new EmbeddedLinuxCodePipelineBaseImageStack(
  app,
  `${resource_prefix}-pipeline-base-image`,
  {
    ...defaultProps,
    description: "AWS IoT Automotive Demo - Base Image Pipeline Stack",
    pipelineSourceBucket: pipelineResourcesStack.pipelineSourceBucket,
    pipelineArtifactBucket: pipelineResourcesStack.pipelineArtifactBucket,
    ecrRepository: pipelineResourcesStack.ecrRepository,
    encryptionKey: pipelineResourcesStack.encryptionKey,
  }
);
baseImageStack.addDependency(pipelineResourcesStack);
baseImageStack.addDependency(bigaIoTResourcesStack);

/**
 * Create a biga pipeline for AMI.
 */
const environmentVariables: {
  [key: string]: codebuild.BuildEnvironmentVariable;
} = {
  'SOURCE_REPO_URL': {
    value: `https://github.com/adadouche/demo-iot-automotive-embeddedlinux-image.git`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'CERTIFICATE_ID': {
    value: `${bigaIoTResourcesStack.certificateId}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'CERTIFICATE_BUCKET': {
    value: `${bigaIoTResourcesStack.certificateBucket.bucketName}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'CERTIFICATE_PREFIX': {
    value: `${bigaIoTResourcesStack.certificatePrefix}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'SSM_PREFIX': {
    value: `${resource_prefix}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'GGV2_REGION': {
    value: `${bigaIoTResourcesStack.region}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'GGV2_TES_RALIAS': {
    value: `${bigaIoTResourcesStack.roleAlias}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'GGV2_DATA_EP': {
    value: `${bigaIoTResourcesStack.iotDataEndpoint}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
  'GGV2_CRED_EP': {
    value: `${bigaIoTResourcesStack.iotCredentialEndpoint}`,
    type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
  },
};

export enum PipelineType {
  EC2 = "ec2",
  GOLDBOX = "goldbox",
  QEMU = "qemu",
}

/**
 * Create project pipelines.
 */
const pipelines = new cdk.Stack(app, `${resource_prefix}-pipelines`);

const pipelineTypes: PipelineType[] = [
  PipelineType.EC2,
  PipelineType.GOLDBOX,
  PipelineType.QEMU,
];
for (const pipelineType of pipelineTypes) {
  const projectPipeline = new EmbeddedLinuxCodePipelineStack(
    app,
    `${resource_prefix}-pipeline-${pipelineType}`,
    {
      ...defaultProps,
      description: `AWS IoT Automotive Demo - Biga Image Pipeline for ${pipelineType} Stack`,
      projectType: ProjectType.Custom,
      ecrRepository: baseImageStack.ecrRepository,
      ecrRepositoryImageTag: baseImageStack.ecrRepositoryImageTag,
      pipelineSourceBucket: pipelineResourcesStack.pipelineSourceBucket,
      pipelineSourcePrefix: pipelineType,
      pipelineArtifactBucket: pipelineResourcesStack.pipelineArtifactBucket,
      pipelineArtifactPrefix: `pipeline-output/${resource_prefix}-${pipelineType}`,
      pipelineOutputBucket: pipelineResourcesStack.pipelineOutputBucket,
      pipelineOutputPrefix: `${resource_prefix}-pipeline-${pipelineType}`,
      vpc: pipelineResourcesStack.vpc,
      encryptionKey: pipelineResourcesStack.encryptionKey,
      sourceCustomPath: path.join(__dirname, "..", "..", "source-repo-biga", "embedded-linux-code-pipeline"),
      environmentVariables: {
        ...environmentVariables,
        'TARGET': {
          value: `${pipelineType}`,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      buildPolicyAdditions: [
        iam.PolicyStatement.fromJson({
          Effect: "Allow",
          Action: "ssm:GetParameter",
          Resource:
            `arn:aws:ssm:${env.region}:${env.account}:parameter/${resource_prefix}*`,
        }),
      ],
    }
  );
  projectPipeline.addDependency(baseImageStack);  
  pipelines.addDependency(projectPipeline)
}