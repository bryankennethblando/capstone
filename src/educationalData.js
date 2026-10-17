// Educational information, specifications, and installation guides

export const EDUCATIONAL_DATA = {
  cpu: {
    id: 'cpu',
    name: 'Central Processing Unit (CPU)',
    category: 'Core Processor',
    subtitle: 'The primary brain and computational engine of the computer system',
    icon: '⚡',
    specs: [
      { label: 'Socket Type', value: 'LGA 1151 (Land Grid Array)' },
      { label: 'Function', value: 'Executes instructions, math calculations, and logic' },
      { label: 'Thermal Interface', value: 'Integrated Heat Spreader (IHS)' },
      { label: 'Pin Interface', value: 'Flat gold contact pads (pins located on socket)' }
    ],
    description: `The Central Processing Unit (CPU) executes every instruction in software, operating systems, and applications. In desktop platforms, the CPU communicates directly with high-speed DDR4 memory controllers and PCI-Express lanes for graphics and NVMe SSDs.`,
    installationGuide: [
      'Locate the golden alignment triangle on the corner of the CPU substrate.',
      'Align the CPU notch with the plastic socket keys on the LGA 1151 socket.',
      'Drop gently straight down without forcing—zero insertion force (ZIF).',
      'Lower the metal load plate and firmly press the retention lever into its locking catch.'
    ],
    safetyWarning: '⚠️ Never touch the gold contact pads with bare fingers; skin oils cause corrosion. Avoid touching motherboard socket pins, as LGA pins bend easily.'
  },

  ram_slot1: {
    id: 'ram_slot1',
    name: 'DDR4 RAM - Channel A (Slot 1)',
    category: 'System Memory',
    subtitle: 'High-speed volatile operational memory for active programs and data',
    icon: '💾',
    specs: [
      { label: 'Memory Standard', value: 'DDR4 SDRAM' },
      { label: 'Pin Count', value: '288-pin DIMM' },
      { label: 'Channel', value: 'Channel A (Primary Channel)' },
      { label: 'Operating Voltage', value: '1.2V standard' }
    ],
    description: `Random Access Memory (RAM) provides immediate, high-bandwidth storage for running processes. Installing matching memory modules in dual-channel slots doubles memory bus bandwidth between the CPU and memory controller.`,
    installationGuide: [
      'Open the latch clips on the ends of the DIMM slot.',
      'Align the offset notch on the RAM stick contacts with the ridge in the DIMM slot.',
      'Apply even downward pressure on both edges until the retaining latches click closed.'
    ],
    safetyWarning: '⚠️ Ensure notch alignment before pressing down. RAM cannot be inserted backwards. Uneven force can crack the motherboard PCB.'
  },

  ram_slot2: {
    id: 'ram_slot2',
    name: 'DDR4 RAM - Channel B (Slot 2)',
    category: 'System Memory',
    subtitle: 'Dual-channel matched memory module for doubled throughput',
    icon: '💾',
    specs: [
      { label: 'Memory Standard', value: 'DDR4 SDRAM' },
      { label: 'Pin Count', value: '288-pin DIMM' },
      { label: 'Channel', value: 'Channel B (Secondary Channel)' },
      { label: 'Architecture', value: 'Dual-Channel 128-bit bus width' }
    ],
    description: `Populating both DIMM slots activates Dual-Channel Mode, allowing the memory controller to read and write to both modules simultaneously, delivering up to twice the data transfer speed.`,
    installationGuide: [
      'Verify slot 1 is installed or match slot colors if multi-channel.',
      'Insert firmly into slot 2 until both clips snap into the locked position.'
    ],
    safetyWarning: '⚠️ Always ground yourself before handling memory sticks to prevent ESD (Electrostatic Discharge) damage.'
  },

  motherboard: {
    id: 'motherboard',
    name: 'Motherboard (Asus Z170-P)',
    category: 'Mainboard / System Spine',
    subtitle: 'The primary printed circuit board uniting all system hardware',
    icon: '🖥️',
    specs: [
      { label: 'Form Factor', value: 'ATX (305 mm × 244 mm)' },
      { label: 'Chipset', value: 'Intel Z170 Express' },
      { label: 'Socket', value: 'LGA 1151' },
      { label: 'Memory Support', value: '4 × DDR4 DIMM (Dual Channel)' },
      { label: 'Expansion', value: 'PCIe 3.0 x16, PCIe x1, M.2 Socket' }
    ],
    description: `The motherboard provides the electrical backbone and communication highways (buses) linking the CPU, RAM, storage drives, graphics card, and external peripherals. It houses the power regulation circuitry (VRMs) and system BIOS/UEFI firmware.`,
    installationGuide: [
      'Install motherboard standoffs into the PC chassis first.',
      'Align rear I/O ports with the case I/O shield.',
      'Fasten screws diagonally with moderate hand tightness.'
    ],
    safetyWarning: '⚠️ Never install a motherboard directly onto metal without brass standoffs—this will cause short circuits!'
  },

  disassembly_overview: {
    id: 'disassembly_overview',
    name: 'Hardware Disassembled & Isolated',
    category: 'System Diagnostics',
    subtitle: 'CPU and Dual-Channel RAM detached for inspection and maintenance',
    icon: '⚙️',
    specs: [
      { label: 'Socket Exposed', value: 'LGA 1151 (1,151 spring contact pins)' },
      { label: 'Memory Slots', value: '2 × 288-pin DDR4 DIMM slots open' },
      { label: 'Status', value: 'Components staged on antistatic mat' },
      { label: 'Next Action', value: 'Click Run Assembly to begin installation' }
    ],
    description: 'The CPU and Dual-Channel DDR4 RAM sticks have been safely unlatched and moved onto workstation trays. When disassembling physical PC hardware, always ensure the power supply is unplugged, capacitors are discharged, and components are placed on antistatic mats.',
    installationGuide: [
      'Inspect socket pins for any bends or debris.',
      'Check RAM stick gold contacts for scratches or dust.',
      'Prepare to reassemble in proper sequence: CPU first, then RAM Channel A, then Channel B.'
    ],
    safetyWarning: '⚠️ Never touch exposed LGA socket pins. A single bent pin can permanently prevent the motherboard from booting.'
  }
};
