#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {
  EmbeddedLinuxPipelineStack,
  BuildImageDataStack,
  BuildImagePipelineStack,
  BuildImageRepoStack,
  PipelineNetworkStack,
  ImageKind,
  ProjectKind,
} from "aws4embeddedlinux-cdk-lib";
import {
  AccountPrincipal,
  ArnPrincipal,
  Effect,
  IRole,
  ManagedPolicy,
  Policy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal
} from "aws-cdk-lib/aws-iam";
import * as path from 'path';

const app = new cdk.App();

/* See https://docs.aws.amazon.com/sdkref/latest/guide/access.html for details on how to access AWS. */
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_DEFAULT_REGION,
};

/**
 * Use these default props to enable termination protection and tag related AWS
 * Resources for tracking purposes.
 */
const defaultProps: cdk.StackProps = {
  tags: { PURPOSE: "META-AWS-BUILD" },
  env,
};

/**
 * Set up the Stacks that create our Build Host.
 */
const buildImageData = new BuildImageDataStack(app, "BuildImageData", {
  ...defaultProps,
  bucketName: `build-image-data-${env.account}-${env.region}`,
});

const buildImageRepo = new BuildImageRepoStack(app, "BuildImageRepo", {
  ...defaultProps,
});

new BuildImagePipelineStack(app, "BuildImagePipeline", {
  ...defaultProps,
  dataBucket: buildImageData.bucket,
  repository: buildImageRepo.repository,
  imageKind: ImageKind.Ubuntu22_04,
});

/**
 * Set up networking to allow us to securely attach EFS to our CodeBuild instances.
 */
const vpc = new PipelineNetworkStack(app, {
  ...defaultProps,
});


/**
 * Create a biga pipeline for AMI.
 */
new EmbeddedLinuxPipelineStack(app, "EC2AMIBigaPipeline", {
  ...defaultProps,
  imageRepo: buildImageRepo.repository,
  imageTag: ImageKind.Ubuntu22_04,
  vpc: vpc.vpc,
  buildPolicyAdditions: [
    PolicyStatement.fromJson({
      Effect: "Allow",
      Action: "secretsmanager:GetSecretValue",
      Resource:
      `arn:aws:secretsmanager:${env.region}:${env.account}:secret:EC2AMIBigaPipeline*`,
    }),
  ],
  layerRepoName: "ec2-ami-biga-layer-repo",
  projectKind: ProjectKind.PokyAmi,
});

/**
 * Create a biga pipeline for agl-nxp-goldbox.
 */
new EmbeddedLinuxPipelineStack(app, "NxpGoldboxBigaPipeline", {
  ...defaultProps,
  imageRepo: buildImageRepo.repository,
  imageTag: ImageKind.Ubuntu22_04,
  vpc: vpc.vpc,
  buildPolicyAdditions: [
    PolicyStatement.fromJson({
      Effect: "Allow",
      Action: "secretsmanager:GetSecretValue",
      Resource:
      `arn:aws:secretsmanager:${env.region}:${env.account}:secret:NxpGoldboxBigaPipeline*`,
    }),
  ],
  layerRepoName: "nxp-goldbox-biga-layer-repo",
  projectKind: ProjectKind.MetaAwsDemo,
});
