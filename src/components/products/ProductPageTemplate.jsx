import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react'
import Navigation from '../Navigation'
import Footer from '../Footer'
import ProductSuggestions from '../ProductSuggestions'

export default function ProductPageTemplate({ productData }) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % productData.features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [productData.features.length])

  const Icon = productData.icon
  const colorClass = productData.colorClass
  const gradientClass = productData.gradientClass

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ProductSuggestions currentPage={productData.slug} category={productData.category} />
      
      {/* Hero Section with Premium Animations */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-40 w-80 h-80 ${colorClass}/10 rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute -bottom-40 -left-40 w-96 h-96 ${colorClass}/5 rounded-full blur-3xl animate-pulse delay-1000`}></div>
        </div>

        <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              <div className={`inline-flex items-center space-x-2 ${colorClass}/10 px-4 py-2 rounded-full animate-fade-in`}>
                <Icon className={`h-5 w-5 ${colorClass} animate-bounce`} />
                <span className={`${colorClass} font-semibold`}>{productData.name}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-foreground animate-slide-up">
                {productData.headline}
                <span className={`block text-transparent bg-clip-text ${gradientClass} mt-2 animate-gradient`}>
                  {productData.subheadline}
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground animate-fade-in-delay">
                {productData.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay-2">
                <Button 
                  size="lg" 
                  className={`${colorClass} text-white hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl`}
                  onClick={() => window.location.href = '/experience'}
                >
                  <span className="text-white">{productData.ctaPrimary}</span>
                  <ArrowRight className="ml-2 h-5 w-5 text-white" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="hover:scale-105 transition-transform duration-300"
                >
                  {productData.ctaSecondary}
                </Button>
              </div>
              
              {/* Quick Stats with Animation */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                {productData.stats.map((stat, index) => (
                  <div 
                    key={index}
                    className="animate-fade-in-delay-3"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`text-3xl font-bold ${colorClass}`}>{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Product Visuals Gallery */}
            <div className="relative animate-float">
              <div className={`bg-gradient-to-br ${colorClass}/20 to-accent/20 rounded-2xl p-4 border ${colorClass}/20 shadow-2xl hover:shadow-3xl transition-shadow duration-500`}>
                {/* Main Featured Image */}
                <div className="bg-card rounded-lg overflow-hidden shadow-2xl mb-4">
                  <img 
                    src={productData.images[0]} 
                    alt={`${productData.name} Interface`}
                    className="w-full h-auto transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-2 gap-4">
                  {productData.images.slice(1).map((image, index) => (
                    <div 
                      key={index}
                      className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                    >
                      <img 
                        src={image} 
                        alt={`${productData.name} Feature ${index + 2}`}
                        className="w-full h-auto transform group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
                
                {/* AI Indicator */}
                <div className="mt-6 flex items-center space-x-2">
                  <Sparkles className={`h-4 w-4 ${colorClass} animate-spin-slow`} />
                  <span className={`text-xs ${colorClass} animate-pulse`}>
                    {productData.aiIndicator}
                  </span>
                </div>
              </div>
              
              {/* Floating Orbs */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${colorClass}/20 rounded-full blur-2xl animate-pulse`}></div>
              <div className={`absolute -top-6 -left-6 w-32 h-32 ${colorClass}/10 rounded-full blur-2xl animate-pulse delay-500`}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Staggered Animation */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {productData.featuresTitle}
            </h2>
            <p className="text-xl text-muted-foreground">
              {productData.featuresSubtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productData.features.map((feature, index) => {
              const FeatureIcon = feature.icon
              return (
                <Card 
                  key={index}
                  className={`border-${colorClass}/20 hover:border-${colorClass}/40 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 ${colorClass}/20 rounded-lg flex items-center justify-center mb-3 group-hover:${colorClass}/30 transition-colors`}>
                      <FeatureIcon className={`h-6 w-6 ${colorClass}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {productData.useCasesTitle}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {productData.useCases.map((useCase, index) => {
              const UseCaseIcon = useCase.icon
              return (
                <div 
                  key={index} 
                  className="text-center group hover:scale-105 transition-transform duration-300"
                >
                  <div className={`w-16 h-16 ${colorClass}/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:${colorClass}/30 transition-colors`}>
                    <UseCaseIcon className={`h-8 w-8 ${colorClass}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section with Icons */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose {productData.name}?
            </h2>
          </div>
          
          <div className="space-y-4">
            {productData.benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-card/50 transition-all duration-300 animate-slide-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CheckCircle className={`h-6 w-6 ${colorClass} flex-shrink-0 mt-1`} />
                <div>
                  <h4 className="font-semibold mb-1">{benefit.title}</h4>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className={`py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r ${colorClass}/10 to-accent/10`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 animate-fade-in">
            {productData.ctaTitle}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in-delay">
            {productData.ctaDescription}
          </p>
          <Button 
            size="lg" 
            className={`${colorClass} !text-white hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-2xl animate-bounce-subtle`}
            onClick={() => window.location.href = '/experience'}
          >
            <span className="text-white">{productData.ctaFinal}</span>
            <ArrowRight className="ml-2 h-5 w-5 text-white" />
          </Button>
        </div>
      </section>

      <Footer />
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-gradient { animation: gradient 3s ease infinite; background-size: 200% 200%; }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-slide-up { animation: slide-up 1s ease-out; }
        .animate-fade-in-delay { animation: fade-in 1s ease-out 0.3s both; }
        .animate-fade-in-delay-2 { animation: fade-in 1s ease-out 0.6s both; }
        .animate-fade-in-delay-3 { animation: fade-in 1s ease-out 0.9s both; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out both; }
        .animate-slide-in-right { animation: slide-in-right 0.8s ease-out both; }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-bounce-subtle { animation: bounce 2s ease-in-out infinite; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  )
}

