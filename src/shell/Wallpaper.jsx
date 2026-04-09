export function Wallpaper() {
  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 0,
        background: `
          radial-gradient(ellipse at 0% 0%, #3D2B1F 0%, transparent 50%),
          radial-gradient(ellipse at 100% 0%, #1A1820 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, #2C2A35 0%, transparent 50%),
          radial-gradient(ellipse at 0% 100%, #1E1C28 0%, transparent 50%)
        `,
        backgroundColor: '#1E1C28',
        backgroundSize: '400% 400%',
        animation: 'meshDrift 24s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes meshDrift {
          0%, 100% {
            background-position: 0% 0%;
          }
          25% {
            background-position: 100% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          75% {
            background-position: 0% 100%;
          }
        }
      `}</style>
    </div>
  )
}
