import { Dice1, Dice2, Dice3, Dice4, Dice5 } from 'lucide-react'
import { Link } from 'react-router-dom'

const Navigation = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-secondary-foreground to-primary">
      <nav className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full px-4 md:px-0">
        <Link
          to="lab1"
          className="bg-white rounded-lg p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform"
        >
          <Dice1 className="h-12 w-12 text-secondary-foreground" />
          <h3 className="mt-4 text-xl font-semibold text-secondary-foreground">Linear Congruential Generator</h3>
        </Link>
        <Link
          to="lab2"
          className="bg-white rounded-lg p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform"
        >
          <Dice2 className="h-12 w-12 text-primary" />
          <h3 className="mt-4 text-xl font-semibold text-primary">MD5</h3>
        </Link>
        <Link
          to="#"
          className="bg-white rounded-lg p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform"
        >
          <Dice3 className="h-12 w-12 text-secondary-foreground" />
          <h3 className="mt-4 text-xl font-semibold text-secondary-foreground">???</h3>
        </Link>
        <Link
          to="#"
          className="bg-white rounded-lg p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform"
        >
          <Dice4 className="h-12 w-12 text-primary" />
          <h3 className="mt-4 text-xl font-semibold text-primary">???</h3>
        </Link>
        <Link
          to="#"
          className="bg-white rounded-lg p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform"
        >
          <Dice5 className="h-12 w-12 text-secondary-foreground" />
          <h3 className="mt-4 text-xl font-semibold text-secondary-foreground">???</h3>
        </Link>
      </nav>
    </div>
  )
}

export default Navigation