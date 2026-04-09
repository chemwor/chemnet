import { motion } from 'framer-motion'

export function BSOD({ onDismiss }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center p-8 cursor-pointer select-none"
      style={{
        zIndex: 99999,
        background: '#0000AA',
        fontFamily: '"Courier New", monospace',
        color: '#FFFFFF',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.05 }}
      onClick={onDismiss}
    >
      <div className="max-w-xl text-sm leading-relaxed">
        <div className="text-center mb-6">
          <span style={{ background: '#AAAAAA', color: '#0000AA', padding: '0 8px' }}>
            EricOS
          </span>
        </div>
        <p className="mb-4">
          A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMCPD(01) +
          00010E36. The current application will be terminated.
        </p>
        <p className="mb-4">
          *  Press any key to terminate the current application.<br />
          *  Press CTRL+ALT+DEL again to restart your computer. You will<br />
          &nbsp;&nbsp;&nbsp;lose any unsaved information in all applications.
        </p>
        <p className="text-center">
          Press any key to continue _
        </p>
      </div>
    </motion.div>
  )
}
