import React from "react";

// 🎯 RESPONSIVE VERSION - Works on Mobile, Tablet, and Desktop
export default function ProteinBarBanner() {
  return (
    <section className="protein-bar-banner">
      <div className="container">
        {/* Header */}
        <div className="banner-header">
          <h1 className="banner-title">
            The Protein Bars With No Chalky Taste
          </h1>
        </div>

        {/* Content */}
        <div className="banner-content">
          <p className="banner-text">
            At <strong>DomNom</strong>, we're <strong>redefining Protein Bars</strong> making them <strong>better than ever</strong>. 
            Unlike most <strong>Protein Bars</strong> that <strong>leave a chalky aftertaste</strong> or are filled with{" "}
            <strong>artificial ingredients, DomNom Protein Bars</strong> are made from <strong>100% natural ingredients.</strong>
          </p>

          <p className="banner-text">
            Every bite delivers <strong>clean, wholesome nutrition</strong> with <strong>real food-based Protein Bars.</strong> 
            We take pride in offering <strong>clean-label Protein Bars</strong> in India, ensuring you get the{" "}
            <strong>best Protein Bars</strong> with no compromises. <strong>Healthy, tasty, and free from unnecessary additives,</strong>{" "}
            that's what <strong>DomNom Protein Bars</strong> are all about!
          </p>

          <a href="/collections/all-products-best-protein-bars-india" className="banner-cta">
            View All
          </a>
        </div>
      </div>

      <style jsx>{`
        /* ===== MOBILE FIRST APPROACH ===== */
        .protein-bar-banner {
          background: #D62641;
          padding: 30px 20px;
          width: 100%;
        }

        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 15px;
        }

        .banner-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .banner-title {
          font-family: 'recoleta', serif;
          font-size: 28px;
          line-height: 1.3;
          color: #ffffff;
          font-weight: 400;
          margin: 0;
          padding: 20px 10px;
        }

        .banner-content {
          text-align: center;
          max-width: 100%;
        }

        .banner-text {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #ffffff;
          margin-bottom: 20px;
        }

        .banner-text strong {
          font-weight: 700;
        }

        .banner-cta {
          display: inline-block;
          background: #FFCB01;
          color: #350E04;
          padding: 12px 35px;
          border-radius: 6px;
          text-decoration: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-top: 10px;
        }

        .banner-cta:hover {
          background: #FFD91F;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        /* ===== TABLET (768px and up) ===== */
        @media (min-width: 768px) {
          .protein-bar-banner {
            padding: 40px 30px;
          }

          .banner-title {
            font-size: 36px;
            padding: 30px 20px;
          }

          .banner-content {
            max-width: 720px;
            margin: 0 auto;
          }

          .banner-text {
            font-size: 15px;
            margin-bottom: 25px;
          }

          .banner-cta {
            padding: 14px 45px;
            font-size: 15px;
          }
        }

        /* ===== DESKTOP (992px and up) ===== */
        @media (min-width: 992px) {
          .protein-bar-banner {
            padding: 50px 40px;
          }

          .container {
            max-width: 1140px;
          }

          .banner-title {
            font-size: 42px;
            padding: 40px;
          }

          .banner-content {
            max-width: 900px;
          }

          .banner-text {
            font-size: 16px;
            margin-bottom: 30px;
          }

          .banner-cta {
            padding: 15px 50px;
            font-size: 16px;
          }
        }

        /* ===== LARGE DESKTOP (1200px and up) ===== */
        @media (min-width: 1200px) {
          .container {
            max-width: 1290px;
          }

          .banner-content {
            max-width: 1000px;
          }
        }
      `}</style>
    </section>
  );
}
