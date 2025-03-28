# biga
biga demo run on goldbox - https://www.nxp.com/design/designs/goldbox-for-vehicle-networking-development-platform:GOLDBOX

Additional necessary packages to build:
```bash
sudo apt install mtools
```

Build image
```bash
repo init -u https://github.com/aws4embeddedlinux/demo-iot-automotive-embeddedlinux-image.git -m manifest.xml -b main

repo sync

source meta-agl/scripts/aglsetup.sh  -f -m biga-goldbox -b build-biga-goldbox

bitbake aws-biga-image
```