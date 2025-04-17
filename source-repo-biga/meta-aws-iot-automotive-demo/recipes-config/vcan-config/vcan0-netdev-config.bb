SUMMARY     = "Setting up vcan0"
LICENSE     = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

inherit systemd allarch

SRC_URI = "\
    file://vcan0.netdev \
    file://80-vcan.network \
"

do_configure[noexec] = "1"
do_compile[noexec] = "1"

do_install() {
    # Install systemd-networkd vcan0 configuration
    install -d ${D}${systemd_unitdir}/network
    install -m 0644 ${WORKDIR}/vcan0.netdev ${D}${systemd_unitdir}/network/
    install -m 0644 ${WORKDIR}/80-vcan.network ${D}${systemd_unitdir}/network/
}

FILES:${PN} += "${systemd_unitdir}/network ${systemd_system_unitdir}"

RRECOMMENDS:${PN} += " \
    kernel-module-vcan \
    kernel-module-c-can-platform \
    kernel-module-can-dev \
    kernel-module-c-can \
    kernel-module-can-bcm \
    kernel-module-can-gw \
    kernel-module-can-raw \
    "