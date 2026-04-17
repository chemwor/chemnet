import daytime from '../assets/wallpapers/daytime.jpg'
import nighttime from '../assets/wallpapers/nighttime.jpg'

function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

export function Wallpaper() {
  const bg = isDaytime() ? daytime : nighttime

  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 0,
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
}
