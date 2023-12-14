SUMMARY     = "Setting up can0"
LICENSE     = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

inherit systemd allarch

SRC_URI = "file://can0.netdev \
"

do_configure[noexec] = "1"
do_compile[noexec] = "1"

do_install() {
    # Install systemd-networkd can0 configuration
    install -d ${D}${systemd_unitdir}/network
    install -m 0644 ${WORKDIR}/can0.netdev ${D}${systemd_unitdir}/network/
}

FILES:${PN} += "${systemd_unitdir}/network ${systemd_system_unitdir}"

RRECOMMENDS:${PN} += " \
    kernel-module-can \
    kernel-module-c-can-platform \
    kernel-module-can-dev \
    kernel-module-c-can \
    kernel-module-can-bcm \
    kernel-module-can-gw \
    kernel-module-can-raw \
    "
