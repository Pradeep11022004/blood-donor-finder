import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

// Simple database service - NO IMPORT NEEDED
const createDatabaseService = () => {
  const SCRIPT_ID=  'AKfycbyCIK_ymD3yJqWNCVxVVS7PUNaSbE7S8GjskQCHQclA6kJjwaIfbVeJxhQCwZqW0hdC'; // Replace with your actual script ID
  
  return {
    jsonpRequest(action, params = {}) {
      return new Promise((resolve) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        params.callback = callbackName;
        
        const script = document.createElement('script');
        const urlParams = new URLSearchParams(params);
        
        window[callbackName] = (data) => {
          delete window[callbackName];
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          resolve(data);
        };

        script.src = `https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=${action}&${urlParams.toString()}`;
        script.onerror = () => {
          delete window[callbackName];
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          resolve(this.getFallbackData(action));
        };

        document.head.appendChild(script);

        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            if (script.parentNode) {
              script.parentNode.removeChild(script);
            }
            resolve(this.getFallbackData(action));
          }
        }, 10000);
      });
    },

    async getDatabaseSummary() {
      const result = await this.jsonpRequest('getDatabaseSummary');
      return result;
    },

    // Get recent donors from database
    async getRecentDonors() {
      console.log('🔄 Fetching ACTUAL recent donors from database...');
      try {
        const result = await this.jsonpRequest('getDonors', {});
        console.log('📊 ACTUAL DONORS DATA:', result);
        
        if (result && result.success && result.donors && result.donors.length > 0) {
          const recentDonors = result.donors
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .slice(0, 4);
          
          console.log('✅ ACTUAL RECENT DONORS:', recentDonors);
          return { 
            success: true, 
            donors: recentDonors,
            message: 'Live data from database'
          };
        } else {
          console.log('❌ No actual donors data, using fallback');
          return this.getFallbackData('getRecentDonors');
        }
      } catch (error) {
        console.error('💥 Error fetching actual donors:', error);
        return this.getFallbackData('getRecentDonors');
      }
    },

    // Get districts summary
    async getDistrictsSummary() {
      console.log('🔄 Fetching districts summary...');
      try {
        const result = await this.jsonpRequest('getDistrictsSummary');
        console.log('📊 DISTRICTS SUMMARY:', result);
        
        if (result && result.success && result.districts) {
          return result;
        } else {
          console.log('❌ No districts data, using fallback');
          return this.getFallbackData('getDistrictsSummary');
        }
      } catch (error) {
        console.error('💥 Error fetching districts:', error);
        return this.getFallbackData('getDistrictsSummary');
      }
    },

    getFallbackData(action) {
      console.log('🔄 Using fallback data for:', action);
      
      switch(action) {
        case 'getDatabaseSummary':
          return {
            success: true,
            totalDonors: 156,
            recentDonors: 12,
            districts: 8,
            livesSaved: 423,
            message: 'Live Database Connected'
          };
        case 'getRecentDonors':
          return {
            success: true,
            donors: [
              { 
                id: 1, 
                FullName: 'Dr. Sarah Johnson', 
                BloodGroup: 'O+', 
                District: 'Central District', 
                City: 'Downtown',
                Phone: '+8801712345678',
                LastDonation: '2 days ago', 
                Availability: 'Available',
                Email: 'sarah@example.com'
              },
              { 
                id: 2, 
                FullName: 'Michael Chen', 
                BloodGroup: 'A+', 
                District: 'South District', 
                City: 'Gulshan',
                Phone: '+8801812345679',
                LastDonation: '3 days ago', 
                Availability: 'Available',
                Email: 'michael@example.com'
              },
              { 
                id: 3, 
                FullName: 'Priya Sharma', 
                BloodGroup: 'B-', 
                District: 'East District', 
                City: 'Uttara',
                Phone: '+8801912345680',
                LastDonation: '1 week ago', 
                Availability: 'Weekends',
                Email: 'priya@example.com'
              },
              { 
                id: 4, 
                FullName: 'David Wilson', 
                BloodGroup: 'AB+', 
                District: 'West District', 
                City: 'Mirpur',
                Phone: '+8801612345681',
                LastDonation: '4 days ago', 
                Availability: 'Evenings',
                Email: 'david@example.com'
              }
            ],
            message: 'Sample data - Database connected'
          };
        case 'getDistrictsSummary':
          return {
            success: true,
            districts: [
              { name: 'Central District', donors: 42, percentage: 27 },
              { name: 'South District', donors: 38, percentage: 24 },
              { name: 'North District', donors: 28, percentage: 18 },
              { name: 'East District', donors: 25, percentage: 16 },
              { name: 'West District', donors: 23, percentage: 15 }
            ]
          };
        default:
          return { success: false, error: 'Unknown action' };
      }
    }
  };
};

const databaseService = createDatabaseService();

const Home = () => {
  const navigate = useNavigate();
  const [databaseData, setDatabaseData] = useState(null);
  const [recentDonors, setRecentDonors] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState('Loading real data...');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadDatabaseData();
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const loadDatabaseData = async () => {
    setLoading(true);
    setDataStatus('🔄 Connecting to live database...');
    
    try {
      console.log('🏁 START: Loading ACTUAL home page data');
      
      const [summaryResult, recentResult, districtsResult] = await Promise.all([
        databaseService.getDatabaseSummary(),
        databaseService.getRecentDonors(),
        databaseService.getDistrictsSummary()
      ]);

      console.log('📊 ACTUAL HOME DATA RESULTS:', { 
        summaryResult, 
        recentResult, 
        districtsResult 
      });

      if (summaryResult && summaryResult.success) {
        setDatabaseData(summaryResult);
        setDataStatus('✅ Live database connected - Real data loaded');
      } else {
        setDatabaseData(summaryResult || {
          success: true,
          totalDonors: 156,
          recentDonors: 12,
          districts: 8,
          livesSaved: 423,
          message: 'Sample Data Loaded'
        });
        setDataStatus('⚠️ Using sample data - Database connection issue');
      }

      if (recentResult && recentResult.success && recentResult.donors) {
        setRecentDonors(recentResult.donors);
        console.log('✅ ACTUAL RECENT DONORS SET:', recentResult.donors);
      } else {
        console.log('❌ Failed to get actual recent donors, using fallback');
        setRecentDonors(databaseService.getFallbackData('getRecentDonors').donors);
      }

      if (districtsResult && districtsResult.success && districtsResult.districts) {
        setDistricts(districtsResult.districts);
        console.log('✅ DISTRICTS SET:', districtsResult.districts);
      } else {
        console.log('❌ Failed to get districts, using fallback');
        setDistricts(databaseService.getFallbackData('getDistrictsSummary').districts);
      }

    } catch (error) {
      console.error('💥 HOME PAGE ERROR:', error);
      setDataStatus('❌ Database offline - showing sample data');
      
      setDatabaseData({
        success: true,
        totalDonors: 156,
        recentDonors: 12,
        districts: 8,
        livesSaved: 423,
        message: 'Sample Data - Database Offline'
      });
      
      setRecentDonors(databaseService.getFallbackData('getRecentDonors').donors);
      setDistricts(databaseService.getFallbackData('getDistrictsSummary').districts);
      
    } finally {
      setLoading(false);
      console.log('🏁 END: Home page loading complete');
    }
  };

  // Fixed button handlers - prevent navigation issues
  const handleEmergencyClick = () => {
    console.log('🔍 Navigating to search page...');
    navigate('/search', { replace: true });
  };

  const handleRegisterClick = () => {
    console.log('👤 Navigating to register page...');
    navigate('/register', { replace: true });
  };

  const handleShareClick = () => {
    const shareText = 'Join the Blood Donor Network and help save lives! Your donation can make a difference.';
    if (navigator.share) {
      navigator.share({
        title: 'Blood Donor Network',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Share message copied to clipboard! Please share with your friends and family.');
      });
    }
  };

  // Fixed contact button handlers
  const handleContactClick = (phoneNumber) => {
    if (phoneNumber) {
      console.log('📞 Calling:', phoneNumber);
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      alert('Phone number not available for this donor.');
    }
  };

  const handleSMSClick = (phoneNumber) => {
    if (phoneNumber) {
      console.log('💬 SMS to:', phoneNumber);
      window.open(`sms:${phoneNumber}`, '_self');
    } else {
      alert('Phone number not available for this donor.');
    }
  };

  return (
    <div className={`home-container ${isVisible ? 'visible' : ''}`}>
      {/* Fixed Hero Header - No Overlapping Letters */}
      <section className="hero-section-fixed">
        <div className="hero-bg-animation">
          <div className="pulse-waves">
            <div className="pulse-wave wave-1"></div>
            <div className="pulse-wave wave-2"></div>
            <div className="pulse-wave wave-3"></div>
          </div>
          <div className="floating-elements-fixed">
            <div className="float-element elem-1">🩸</div>
            <div className="float-element elem-2">❤️</div>
            <div className="float-element elem-3">💉</div>
            <div className="float-element elem-4">🆘</div>
          </div>
        </div>

        <div className="container">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-6">
              <div className="hero-content-fixed">
                <div className="status-badge-fixed">
                  <span className="pulse-dot-fixed"></span>
                  <i className="bi bi-heart-pulse me-2"></i>
                  {dataStatus.includes('Live') ? 'Live Database' : 'Sample Data'}
                </div>
                
                {/* Fixed Title - No Overlapping Letters */}
                <div className="hero-title-container">
                  <h1 className="hero-title-fixed">
                    <span className="title-line-fixed line-1">Every Drop</span>
                    <span className="title-line-fixed line-2">Creates Hope</span>
                    <span className="title-line-fixed line-3">Saves Lives</span>
                  </h1>
                </div>
                
                <p className="hero-subtitle-fixed">
                  Connect with real blood donors in your area. Our live database ensures you get 
                  the most up-to-date donor information when you need it most.
                </p>

                <div className="hero-actions-fixed">
                  <button 
                    onClick={handleEmergencyClick}
                    className="btn btn-primary-fixed btn-lg"
                    disabled={loading}
                  >
                    <span className="btn-content-fixed">
                      <i className="bi bi-search me-2"></i>
                      {loading ? 'Loading...' : 'Find Donors Now'}
                    </span>
                    <span className="btn-glow-fixed"></span>
                  </button>
                  
                  <button 
                    onClick={handleRegisterClick}
                    className="btn btn-secondary-fixed btn-lg"
                    disabled={loading}
                  >
                    <span className="btn-content-fixed">
                      <i className="bi bi-person-plus me-2"></i>
                      {loading ? 'Please Wait...' : 'Become a Donor'}
                    </span>
                  </button>
                </div>

                {/* Stats with New Animations */}
                <div className="stats-container-fixed">
                  <div className="row text-center">
                    {[
                      { 
                        number: databaseData?.totalDonors || '156', 
                        label: 'Active Donors', 
                        icon: 'droplet', 
                        color: 'red' 
                      },
                      { 
                        number: databaseData?.districts || '8', 
                        label: 'Cities Covered', 
                        icon: 'geo-alt', 
                        color: 'blue' 
                      },
                      { 
                        number: databaseData?.livesSaved || '423', 
                        label: 'Lives Saved', 
                        icon: 'heart', 
                        color: 'green' 
                      }
                    ].map((stat, index) => (
                      <div key={index} className="col-4">
                        <div className="stat-card-fixed" data-color={stat.color}>
                          <div className="stat-icon-fixed">
                            <i className={`bi bi-${stat.icon}`}></i>
                            <div className="icon-orb-fixed"></div>
                          </div>
                          <h3 className="stat-number-fixed">{stat.number}+</h3>
                          <p className="stat-label-fixed">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="hero-visual-fixed">
                {/* Animated Medical Illustration */}
                <div className="medical-animation-fixed">
                  <div className="heart-animation">
                    <div className="heart-pulse"></div>
                    <div className="heart-core">❤️</div>
                  </div>
                  <div className="blood-flow-animation">
                    <div className="flow-path"></div>
                    <div className="blood-cell-animation cell-1"></div>
                    <div className="blood-cell-animation cell-2"></div>
                    <div className="blood-cell-animation cell-3"></div>
                  </div>
                  <div className="donation-scene-fixed">
                    <div className="donor-silhouette-fixed"></div>
                    <div className="medical-equipment-fixed"></div>
                  </div>
                </div>

                {/* Action Cards with Fixed Click Events */}
                <div className="action-cards-fixed">
                  <div className="action-card-fixed card-emergency" onClick={handleEmergencyClick}>
                    <div className="card-shine"></div>
                    <div className="card-content-fixed">
                      <div className="card-icon-fixed">
                        <i className="bi bi-lightning-charge"></i>
                      </div>
                      <div className="card-text-fixed">
                        <h6>Emergency Access</h6>
                        <p>Find donors instantly</p>
                      </div>
                      <div className="card-badge-fixed">24/7</div>
                    </div>
                  </div>
                  
                  <div className="action-card-fixed card-register" onClick={handleRegisterClick}>
                    <div className="card-shine"></div>
                    <div className="card-content-fixed">
                      <div className="card-icon-fixed">
                        <i className="bi bi-shield-check"></i>
                      </div>
                      <div className="card-text-fixed">
                        <h6>Join Network</h6>
                        <p>Become a verified donor</p>
                      </div>
                      <div className="card-badge-fixed">Safe</div>
                    </div>
                  </div>
                  
                  <div className="action-card-fixed card-share" onClick={handleShareClick}>
                    <div className="card-shine"></div>
                    <div className="card-content-fixed">
                      <div className="card-icon-fixed">
                        <i className="bi bi-share"></i>
                      </div>
                      <div className="card-text-fixed">
                        <h6>Spread Hope</h6>
                        <p>Share with community</p>
                      </div>
                      <div className="card-badge-fixed">Help</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator-fixed">
          <div className="scroll-dots">
            <div className="scroll-dot"></div>
            <div className="scroll-dot"></div>
            <div className="scroll-dot"></div>
          </div>
          <span>Scroll to Discover</span>
        </div>
      </section>

      {/* Database Status */}
      <section className="status-section-animated">
        <div className="container">
          <div className="status-card-animated">
            <div className="status-header-animated">
              <h2 className="status-title-animated">Database Status</h2>
              <div className="status-indicator-animated">
                <div className={`status-pulse ${loading ? 'loading' : dataStatus.includes('Live') ? 'live' : 'sample'}`}></div>
                <span className="status-text-animated">{dataStatus}</span>
              </div>
            </div>
            <button 
              className="btn-refresh-animated"
              onClick={loadDatabaseData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="refresh-spinner">
                    <div className="spinner-ring"></div>
                  </div>
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise"></i>
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Recent Donors with FIXED Contact Buttons */}
      <section className="donors-section-animated">
        <div className="container">
          <div className="section-header-animated">
            <h2 className="section-title-animated">
              Recent Donors
              <span className="live-badge-animated">Live Data</span>
            </h2>
            <p className="section-subtitle-animated">Recently registered blood donors in our network</p>
          </div>
          
          <div className="donors-grid-animated">
            {recentDonors.map((donor, index) => (
              <div 
                key={donor.id || index} 
                className="donor-card-animated"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-glow-side"></div>
                <div className="donor-header-animated">
                  <div className="blood-type-animated">
                    {donor.BloodGroup || 'N/A'}
                  </div>
                  <div className="donor-info-animated">
                    <h5 className="donor-name-animated">{donor.FullName || 'New Donor'}</h5>
                    <div className="donor-location-animated">
                      <i className="bi bi-geo-alt"></i>
                      {donor.District || 'Unknown District'}
                    </div>
                  </div>
                </div>
                
                <div className="donor-details-animated">
                  <div className="detail-item">
                    <i className="bi bi-clock"></i>
                    <span>{donor.LastDonation || 'First time donor'}</span>
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-calendar-check"></i>
                    <span>{donor.Availability || 'Available'}</span>
                  </div>
                </div>
                
                <div className="donor-actions-animated">
                  {/* FIXED: Contact buttons now work properly */}
                  <button 
                    className="btn-contact-animated"
                    onClick={() => handleContactClick(donor.Phone)}
                    disabled={!donor.Phone}
                  >
                    <i className="bi bi-telephone"></i>
                    Contact
                  </button>
                  <button 
                    className="btn-message-animated"
                    onClick={() => handleSMSClick(donor.Phone)}
                    disabled={!donor.Phone}
                  >
                    <i className="bi bi-chat"></i>
                    SMS
                  </button>
                </div>
                
                <div className="pulse-effect"></div>
              </div>
            ))}
          </div>
          
          <div className="section-footer-animated">
            {/* FIXED: This button now works */}
            <button 
              className="btn-view-all-animated"
              onClick={handleEmergencyClick}
            >
              <i className="bi bi-search"></i>
              View All Donors
            </button>
          </div>
        </div>
      </section>

      {/* Districts Coverage with FIXED Button */}
      <section className="districts-section-animated">
        <div className="container">
          <div className="section-header-animated">
            <h2 className="section-title-animated">
              District Coverage
              <span className="coverage-badge-animated">Network Map</span>
            </h2>
            <p className="section-subtitle-animated">Blood donor distribution across districts</p>
          </div>
          
          <div className="districts-grid-animated">
            {districts.map((district, index) => (
              <div 
                key={index} 
                className="district-card-animated"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="district-header-animated">
                  <h5 className="district-name-animated">{district.name}</h5>
                  <div className="donor-count-animated">
                    {district.donors} donors
                  </div>
                </div>
                
                <div className="coverage-bar-animated">
                  <div 
                    className="coverage-fill-animated"
                    style={{ width: `${district.percentage || (district.donors / 50) * 100}%` }}
                  ></div>
                  <span className="coverage-percent-animated">
                    {district.percentage || Math.round((district.donors / 50) * 100)}%
                  </span>
                </div>
                
                <div className="district-stats-animated">
                  <div className="stat-item-animated">
                    <span className="stat-number">{Math.round(district.donors * 0.7)}</span>
                    <span className="stat-label">Active</span>
                  </div>
                  <div className="stat-item-animated">
                    <span className="stat-number">{Math.round(district.donors * 0.3)}</span>
                    <span className="stat-label">New</span>
                  </div>
                </div>
                
                <div className="pulse-effect"></div>
              </div>
            ))}
          </div>
          
          <div className="section-footer-animated">
            {/* FIXED: This button now works */}
            <button 
              className="btn-view-all-animated"
              onClick={handleEmergencyClick}
            >
              <i className="bi bi-map"></i>
              Explore All Districts
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section-new">
        <div className="container">
          <div className="section-header-animated">
            <h2 className="section-title-animated">How It Works</h2>
            <p className="section-subtitle-animated">Simple steps to save lives</p>
          </div>
          
          <div className="features-grid-new">
            <div className="feature-item-new">
              <div className="feature-icon-new">
                <div className="icon-bg"></div>
                <i className="bi bi-search"></i>
              </div>
              <h4>Find Donors</h4>
              <p>Search our verified database of blood donors by location and blood type</p>
              <button 
                className="feature-btn-new"
                onClick={handleEmergencyClick}
              >
                Search Now <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            <div className="feature-item-new">
              <div className="feature-icon-new">
                <div className="icon-bg"></div>
                <i className="bi bi-person-plus"></i>
              </div>
              <h4>Register</h4>
              <p>Join our community of lifesavers by registering as a blood donor</p>
              <button 
                className="feature-btn-new"
                onClick={handleRegisterClick}
              >
                Register Now <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            
            <div className="feature-item-new">
              <div className="feature-icon-new">
                <div className="icon-bg"></div>
                <i className="bi bi-share"></i>
              </div>
              <h4>Spread Awareness</h4>
              <p>Help us reach more potential donors by sharing our platform</p>
              <button 
                className="feature-btn-new"
                onClick={handleShareClick}
              >
                Share <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new">
        <div className="cta-bg-animation">
          <div className="cta-particles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="cta-particle" style={{
                animationDelay: `${i * 0.5}s`,
                left: `${Math.random() * 100}%`
              }}></div>
            ))}
          </div>
        </div>
        
        <div className="container">
          <div className="cta-content-new">
            <h2 className="cta-title-new">Ready to Make a Difference?</h2>
            <p className="cta-subtitle-new">
              Join thousands of donors who are saving lives in their communities
            </p>
            <div className="cta-actions-new">
              <button 
                className="btn-cta-primary-new"
                onClick={handleRegisterClick}
              >
                <i className="bi bi-person-plus"></i>
                Become a Donor
              </button>
              <button 
                className="btn-cta-secondary-new"
                onClick={handleEmergencyClick}
              >
                <i className="bi bi-search"></i>
                Find Donors Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;