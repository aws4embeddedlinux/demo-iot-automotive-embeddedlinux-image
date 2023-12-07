# biga-ec2
run biga demo on ec2

Build image
```bash
repo init -u https://github.com/aws4embeddedlinux/demo-iot-automotive-embeddedlinux-image.git -m manifest.xml -b main

source meta-agl/scripts/aglsetup.sh  -f -m biga-ec2 -b build-biga-ec2

bitbake aws-biga-image
```
