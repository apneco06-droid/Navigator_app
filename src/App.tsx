import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'

function Home() {
  return (
    <div className="page">
      <h1>Navigator App</h1>
      <p>Welcome to your new application. Start building something great!</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-brand">Navigator</div>
        <div className="nav-links">
          <Link to="/">Home</Link>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
