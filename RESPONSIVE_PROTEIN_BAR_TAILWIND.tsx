import React from "react";

// 🎯 TAILWIND VERSION - Fully Responsive
export default function ProteinBarBannerTailwind() {
  return (
    <section className="w-full bg-[#D62641] px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1140px] xl:max-w-[1290px]">
        {/* Header */}
        <div className="mb-6 text-center sm:mb-8 md:mb-10">
          <h1 
            className="px-2 py-5 text-2xl font-normal leading-tight text-white sm:px-4 sm:py-6 sm:text-3xl md:px-8 md:py-8 md:text-4xl lg:px-10 lg:text-[42px]"
            style={{ fontFamily: 'recoleta, serif' }}
          >
            The Protein Bars With No Chalky Taste
          </h1>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-full text-center sm:max-w-[640px] md:max-w-[720px] lg:max-w-[900px] xl:max-w-[1000px]">
          <p className="mb-5 text-sm leading-relaxed text-white sm:text-base md:mb-6 lg:mb-7 lg:text-base">
            At <strong>DomNom</strong>, we're <strong>redefining Protein Bars</strong> making them{" "}
            <strong>better than ever</strong>. Unlike most <strong>Protein Bars</strong> that{" "}
            <strong>leave a chalky aftertaste</strong> or are filled with{" "}
            <strong>artificial ingredients, DomNom Protein Bars</strong> are made from{" "}
            <strong>100% natural ingredients.</strong>
          </p>

          <p className="mb-5 text-sm leading-relaxed text-white sm:text-base md:mb-6 lg:mb-7 lg:text-base">
            Every bite delivers <strong>clean, wholesome nutrition</strong> with{" "}
            <strong>real food-based Protein Bars.</strong> We take pride in offering{" "}
            <strong>clean-label Protein Bars</strong> in India, ensuring you get the{" "}
            <strong>best Protein Bars</strong> with no compromises.{" "}
            <strong>Healthy, tasty, and free from unnecessary additives,</strong> that's what{" "}
            <strong>DomNom Protein Bars</strong> are all about!
          </p>

          <a
            href="/collections/all-products-best-protein-bars-india"
            className="mt-3 inline-block rounded-md bg-[#FFCB01] px-8 py-3 text-sm font-medium text-[#350E04] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#FFD91F] hover:shadow-lg sm:px-10 sm:py-3.5 sm:text-base md:px-12 md:text-base"
          >
            View All
          </a>
        </div>
      </div>
    </section>
  );
}
