import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layouts'
import CreatePage from './pages/CreatePage'
import ViewPage from './pages/viewpage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CreatePage />} />
          <Route path="s/:token" element={<ViewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}