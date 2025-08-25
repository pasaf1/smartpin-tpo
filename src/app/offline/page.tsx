'use client'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-luxury-50 to-luxury-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-luxury-2xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.196l.707.707a1 1 0 001.414 0l.707-.707M12 21.804l-.707-.707a1 1 0 00-1.414 0l-.707.707M2.196 12l.707-.707a1 1 0 000-1.414L2.196 9M21.804 12l-.707.707a1 1 0 000 1.414l.707.707"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-luxury-900 mb-4">You're Offline</h1>
        
        <p className="text-luxury-600 mb-6">
          It looks like you've lost your internet connection. Don't worry - you can still view cached content and any changes will sync when you're back online.
        </p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-luxury-700">
            <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            View cached roofs and pins
          </div>
          <div className="flex items-center text-sm text-luxury-700">
            <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Add new pins offline
          </div>
          <div className="flex items-center text-sm text-luxury-700">
            <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Auto-sync when reconnected
          </div>
        </div>
        
        <button
          onClick={handleRetry}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-white py-3 rounded-xl font-semibold hover:from-gold-600 hover:to-gold-700 transition-colors shadow-luxury"
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="w-full mt-3 text-luxury-600 hover:text-luxury-900 font-semibold transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}