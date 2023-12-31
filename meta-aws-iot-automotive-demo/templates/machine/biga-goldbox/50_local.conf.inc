###### instead of using fsl-auto distro we copy this here to have a AGL base ######
# require conf/distro/fsl-auto.conf
DISTRO = "fsl-auto"
# disable image_prelink
USER_CLASSES = ""

MACHINE = "s32g274ardb2"

BB_DANGLINGAPPENDS_WARNONLY ?= "true"

SDKMACHINE = "x86_64"

# ggc_user, ggc_group, user, users and groupds needs to added to meta-agl/meta-agl-core/files/passwd meta-agl/meta-agl-core/files/group when enabled
USERADD_ERROR_DYNAMIC = "0"

# This must be disabled for this device.
ROS_WORLD_SKIP_GROUPS += " fortran"

# this will force bitbake to use meta-aws crt recipe over ROS ones
BBFILE_PRIORITY_meta-aws = "99"

# those are required to build gg-obs components
TOOLCHAIN_TARGET_TASK += "aws-iot-device-sdk-cpp-v2-dev fmt-dev aws-crt-cpp-dev"

# systemd
DISTRO_FEATURES:append = " systemd"
VIRTUAL-RUNTIME_init_manager = "systemd"
VIRTUAL-RUNTIME_initscripts = ""
VIRTUAL-RUNTIME_syslog = ""

# adding this packages to image break ssh login for EC2, so leave it here.
IMAGE_INSTALL += " ssh"
IMAGE_INSTALL += " packagegroup-core-ssh-openssh minicom avahi-daemon "
HOSTNAME_pn-base-files = "goldbox"

# necessary to have a working network
BBMASK += " \
        meta-agl/meta-agl-core/recipes-core/systemd/systemd-conf_%.bbappend \
        meta-agl/meta-agl-core/recipes-core/systemd/systemd_%.bbappend \
"

# create can0 network interface
IMAGE_INSTALL += "can0-netdev-config"

PACKAGECONFIG:pn-greengrass-bin += "fleetprovisioning"

# becareful setting those values just in the image does not work, because they are not propagated correct to greengrass-bin recipe
GGV2_THING_NAME  = "vCar"
GGV2_THING_GROUP = "EmbeddedLinuxFleet"
