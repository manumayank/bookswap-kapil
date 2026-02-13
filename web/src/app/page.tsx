import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">📚 BookSwap</h1>
          <nav className="flex gap-4">
            <Link href="/browse" className="text-gray-600 hover:text-green-600">
              Browse Books
            </Link>
            <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Exchange School Books<br />
          <span className="text-green-600">Save Money, Help Others</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with parents in your school or city to exchange textbooks. 
          Give away books your child no longer needs, find books for the new school year.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/browse" className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700">
            Find Books
          </Link>
          <Link href="/login" className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50">
            List Your Books
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">1. List or Search</h4>
              <p className="text-gray-600">
                List books you want to give away or search for books you need by class, board, and school.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">2. Get Matched</h4>
              <p className="text-gray-600">
                Our system matches you with parents nearby. Same school matches get priority.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📦</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">3. Exchange</h4>
              <p className="text-gray-600">
                Coordinate pickup at school, home, or via courier. Books find new homes!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <div className="text-green-100">Books Exchanged</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <div className="text-green-100">Happy Parents</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <div className="text-green-100">Schools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <div className="text-green-100">Cities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2026 BookSwap. Made with ❤️ for parents and students.</p>
        </div>
      </footer>
    </div>
  );
}
