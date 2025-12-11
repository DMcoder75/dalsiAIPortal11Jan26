import { useState, useEffect } from 'react'
import App from '../App'
import EnhancedChatInterface from './EnhancedChatInterface'
import DalSiAIPage from './DalSiAIPage'
import DalSiAIViPage from './DalSiAIViPage'
import AboutPage from './AboutPage'
import ContactPage from './ContactPage'
import TermsPage from './TermsPage'
import PrivacyPage from './PrivacyPage'
import NewsletterPage from './NewsletterPage'
import SitemapPage from './SitemapPage'
import ProfilePage from './ProfilePage'
import AuthModal from './AuthModal'
import Billing from '../pages/Billing'
import { useAuth } from '../contexts/AuthContext'

// Model Overview Pages
import DalsiAIModelPage from './models/DalsiAIModelPage'
import DalsiAIViModelPage from './models/DalsiAIViModelPage'
import DalsiAIVdModelPage from './models/DalsiAIVdModelPage'

// Product Pages - Text AI
import WriterProPage from './products/WriterProPage'
import CodeGeniusPage from './products/CodeGeniusPage'
import BusinessSuitePage from './products/BusinessSuitePage'
import ResearcherPage from './products/ResearcherPage'
import ChatbotBuilderPage from './products/ChatbotBuilderPage'

// Product Pages - Vision AI
import VisionScanPage from './products/VisionScanPage'
import MedVisionPage from './products/MedVisionPage'
import ArtStudioPage from './products/ArtStudioPage'
import InspectorPage from './products/InspectorPage'
import BrandGuardPage from './products/BrandGuardPage'

// Product Pages - Media AI
import MovieMakerPage from './products/MovieMakerPage'
import TranslateGlobalPage from './products/TranslateGlobalPage'
import MusicStudioPage from './products/MusicStudioPage'
import VideoAdsPage from './products/VideoAdsPage'
import LearningPlatformPage from './products/LearningPlatformPage'

export default function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useAuth() // Subscribe to auth changes to trigger re-renders

  console.log('Router render - user:', user)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  const showAuth = () => setShowAuthModal(true)
  const hideAuth = () => setShowAuthModal(false)

  // Make functions globally available
  window.navigate = navigate
  window.showAuth = showAuth

  const renderPage = () => {
    switch (currentPath) {
      case '/chat':
      case '/experience':
        return <EnhancedChatInterface />
      
      // Model Overview Pages
      case '/models/dalsi-ai':
        return <DalsiAIModelPage />
      case '/models/dalsi-ai-vi':
        return <DalsiAIViModelPage />
      case '/models/dalsi-ai-vd':
        return <DalsiAIVdModelPage />
      
      // Text AI Products
      case '/products/writer-pro':
        return <WriterProPage />
      case '/products/code-genius':
        return <CodeGeniusPage />
      case '/products/business-suite':
        return <BusinessSuitePage />
      case '/products/researcher':
        return <ResearcherPage />
      case '/products/chatbot-builder':
        return <ChatbotBuilderPage />
      
      // Vision AI Products
      case '/products/vision-scan':
        return <VisionScanPage />
      case '/products/medvision':
        return <MedVisionPage />
      case '/products/art-studio':
        return <ArtStudioPage />
      case '/products/inspector':
        return <InspectorPage />
      case '/products/brand-guard':
        return <BrandGuardPage />
      
      // Media AI Products
      case '/products/moviemaker':
        return <MovieMakerPage />
      case '/products/translate-global':
        return <TranslateGlobalPage />
      case '/products/music-studio':
        return <MusicStudioPage />
      case '/products/video-ads':
        return <VideoAdsPage />
      case '/products/learning-platform':
        return <LearningPlatformPage />
      
      // Legacy routes (keeping for backward compatibility)
      case '/products/dalsi-ai':
        return <DalSiAIPage />
      case '/products/dalsi-aivi':
        return <DalSiAIViPage />
      
      // Other pages
      case '/profile':
        return <ProfilePage />
      case '/billing':
        return <Billing />
      case '/about':
        return <AboutPage />
      case '/contact':
        return <ContactPage />
      case '/terms':
        return <TermsPage />
      case '/privacy':
        return <PrivacyPage />
      case '/newsletter':
        return <NewsletterPage />
      case '/sitemap':
        return <SitemapPage />
      default:
        return <App />
    }
  }

  return (
    <>
      {renderPage()}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={hideAuth}
      />
    </>
  )
}
