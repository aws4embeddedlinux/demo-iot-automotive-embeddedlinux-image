## demo-iot-automotive-embeddedlinux-image

This repository wiil create the embedded-linux image, which is used by the [AWS IoT Automotive Cloud](https://github.com/aws4embeddedlinux/demo-iot-automotive-cloud) demo.

## TODO

- Address the AWS CodeCommit deprecation 
  - use connection ot a GitHub/GitLab?
  - host a self-managed GitLab?

### Prerequisites 

This is the list of pre requisites for completing the installation and deployment:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)
- [Node.js and NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- OS Packages 
  - Zip & Unzip

### Setting environment variables

```bash
export AWS_PROFILE="default"
export AWS_DEFAULT_REGION=$(aws configure get region --profile ${AWS_PROFILE})
export AWS_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text --profile ${AWS_PROFILE})

echo "PROFILE : $AWS_PROFILE"
echo "ACCOUNT : $AWS_DEFAULT_ACCOUNT"
echo "REGION  : $AWS_DEFAULT_REGION"
```

### Clone the project

```bash
git clone https://github.com/aws4embeddedlinux/demo-iot-automotive-embeddedlinux-image.git
cd demo-iot-automotive-embeddedlinux-image
```

### Bootstrap CDK

> [!NOTE]
> Only required once unless you upgrade your cdk version

```bash
cdk bootstrap aws://$AWS_DEFAULT_ACCOUNT/$AWS_DEFAULT_REGION
```

### Install packages and build the stack

First move to the `cdk` folder:
 
```bash
cd cdk
```

Then you will need to install the CDK library including the `aws4embeddedlinux-ci` library either using `npm`:

```bash
npm install 
npm run build
```

of `yarn':

```bash
yarn install
yarn build
```

> If you are not familliar with Yarn, please refer to the [documentation](https://yarnpkg.com/getting-started).

> [!NOTE]
>
> While the CDK projects often do not require that you invoke the build command separately, doing so will ensure various assets in the library are packaged correctly.

### Deploy the Base Image Pipeline CDK stack

> [!NOTE]
>
> The used [library](https://github.com/aws4embeddedlinux/aws4embeddedlinux-ci) is tested against Node Versions 18, 20 and 22. If these versions are not available for your system, we recommend
> using [NVM](https://github.com/nvm-sh/nvm) to install a compatible version
>

```bash
cdk deploy biga-ci-pipeline-base-image \
  --require-approval never
```

> _NOTE_:
> The `biga-ci-pipeline-base-image` pipeline will need to be successfully completed before other pipelines can work correctly. 

**_Expected build times: 5 minutes_**

You can check that the pipeline completed sucessfully when the following command returns an ***imageIds** entry :

```bash
aws ecr list-images \
    --repository-name "biga-ci-$AWS_DEFAULT_ACCOUNT-$AWS_DEFAULT_REGION-repo" \
    --query "imageIds[?imageTag=='biga-ci-pipeline-base-image']"
```

Once the pipeline completes and the image is available in the ECR repository, the other `EmbeddedLinuxPipeline` stacks can be created and executed.

### Deploy the Biga Pipeline CDK stack

After the base image pipeline completes, the other pipeline stacks are ready to be deployed.

To deploy a specific pipeline type, you can use the following CDK deploy command:

```bash
cdk deploy <pipeline-id> --require-approval
```

where **\<pipeline-id\>** can be one or more of the following: 

| Name                | Pipeline stack id          |
|---------------------|----------------------------|
| EC2 AMI             | `biga-ci-pipeline-ec2`     |
| NXP GoldBox         | `biga-ci-pipeline-goldbox` |
| Qemu Embedded Linux | `biga-ci-pipeline-qemu`    |

or one ofthe following command to deploy all pipelines:

```bash
cdk deploy biga-ci-pipelines \
  --require-approval never
```

or:

```bash
cdk deploy --all --require-approval never
```

### Cleanup

The `cdk destroy` command can be used to remove individual pipelines and their related resources. This can also be done in the CloudFormation Console Page.

> **Do not delete stacks while a CodePipeline is running, this can lead to unexpected failures!**

To remove all the resources associated with this application:

```bash
cdk destroy --all --force
```

----- 

## NXP Goldbox - Creating a flash device

In case of flashing the NXP GoldBox, once the **biga-build-nxp-goldbox-** pipeline is completed, you can simply go to the Artifacts S3 bucket and download the `sdcard` image. 

Alternatively, you can run the following commands:

```sh
ami_s3_bucket_name=$(aws cloudformation describe-stacks --profile ${AWS_PROFILE} --stack-name biga-ci-build-nxp-goldbox --output text --query "Stacks[0].Outputs[?OutputKey=='BuildOutput'].OutputValue")

echo "Output bucket name : $ami_s3_bucket_name"

aws s3 cp s3://${ami_s3_bucket_name}/aws-biga-image-s32g274ardb2.sdcard .
```

Once the download is complete, insert the SDCard into the computer.

If you are a Windows user, you can use [Rufus]() to create you SD Card.

If you are a Linux/Mac user, proceed with the next steps.

To identify the device name of the SD card you can execute:

```
# Linux
lsblk
# Mac
diskutil list
```

And to unmount:

```
# Linux
sudo umount /dev/sdX1
# Mac
diskutil unmount /dev/diskXs1
```

Make sure to replace the `X` with the right block device or drive letter.

Now we can flash the device:

> Please note that it is important to specify the right block device here, otherwise this can erase all of your data, so be careful.

```sh
# Linux & Mac
sudo dd if=./aws-biga-image-s32g274ardb2.sdcard of=/dev/diskX bs=1m && sync
```

## NXP Goldbox - Connect to the NXP Goldbox device

Once completed, insert back the SD card into the GoldBox and reboot or power cycle the device. This will boot the device and we should be able to `ssh` into it if the host is in the same network:


```sh
ssh root@s32g274ardb2.local
```

# Troubleshooting 

## EC2 Graviton AMI // debugging

Those steps are just necessary for debugging, or manually starting an EC2.

In a scenario where we use an EC2 instance, we should be able to find the latest AMI that was created by the pipeline by doing:

```bash
export AWS_DEFAULT_REGION=$(aws configure get region)

aws ec2 describe-images \
    --region $AWS_DEFAULT_REGION \
    --owners self \
    --query 'Images | sort_by(@, &CreationDate) | [-1]' \
    --output json
```

This command sorts AMI images and provides us with the latest entry. From here, we should grab the latest `ImageId`. Please note that the description should look something like this:

```
 "Description": "DISTRO=poky;DISTRO_CODENAME=quillback;DISTRO_NAME=Automotive Grade Linux;DISTRO_VERSION=16.91.0...
```

Second, we will need a key pair:

```bash
aws ec2 create-key-pair --key-name biga --query 'KeyMaterial' --output text > biga.pem
chmod 400 biga.pem
```


Third, we need a security group (to allow ssh access later on)

```bash
aws ec2 create-security-group --group-name bigaSG --description "a default sg for biga"
aws ec2 authorize-security-group-ingress --group-id <security_group_id>  --protocol tcp  --port 22  --cidr 0.0.0.0/0
```

If you already created it, you can find the security_group_id this way:

```bash
aws ec2 describe-security-groups     --filters Name=group-name,Values=*biga*      --query "SecurityGroups[*].{Name:GroupName,ID:GroupId}"
```

And finally, we can launch the Graviton instance:

```bash
aws ec2 run-instances --image-id <ImageId> --instance-type t4g.micro --key-name biga --security-group-ids <security_group_id> --count 1
```

This will output the `InstanceId`, which we can use to get the public IP:

```bash
aws ec2 describe-instances --instance-ids <InstanceId> --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

Which we will need to `ssh` to the target:

```bash
ssh -i biga.pem user@<public IP>
```

### Testing the Device

Now we can start deploying the Greengrass components to the target.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
