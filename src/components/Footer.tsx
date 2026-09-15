import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import logo from "../assets/logo-beangate.png";
import { Link } from 'react-router-dom';

interface ContactInfo {
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
}

const DEFAULT_CONTACT: ContactInfo = {
  contactPhone: "+91 74711 12020\n+91 97527 40090",
  contactEmail: "info@beangates.com\nbeangate.official@gmail.com",
  contactAddress: "Flat No. A-4 / 501, Kokta Transport Nagar,\nBhopal, Madhya Pradesh – 462022",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
};

const Footer = () => {
  const [contact, setContact] = useState<ContactInfo>(DEFAULT_CONTACT);

  const fetchContact = () => {
    try {
      const s = localStorage.getItem("bg_plan_config");
      if (s) {
        const parsed = JSON.parse(s);
        setContact((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {}

    fetch("/api/planconfig")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setContact((prev) => ({ ...prev, ...data }));
          try {
            const current = localStorage.getItem("bg_plan_config");
            const existing = current ? JSON.parse(current) : {};
            localStorage.setItem("bg_plan_config", JSON.stringify({ ...existing, ...data }));
          } catch (e) {}
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchContact();

    const handleStorage = () => fetchContact();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("bg_config_updated", fetchContact);
    window.addEventListener("focus", fetchContact);

    const interval = setInterval(fetchContact, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("bg_config_updated", fetchContact);
      window.removeEventListener("focus", fetchContact);
    };
  }, []);

  const phoneText = contact.contactPhone || DEFAULT_CONTACT.contactPhone || "";
  const emailText = contact.contactEmail || DEFAULT_CONTACT.contactEmail || "";
  const addressText = contact.contactAddress || DEFAULT_CONTACT.contactAddress || "";

  return (
    <footer className="bg-navy text-gray-400 pt-16 pb-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div>
            <div className="text-white font-bold text-xl flex items-center mb-6">
              <img src={logo} alt="BeanGate Logo" className="h-10 sm:h-12 w-auto object-contain mr-3"/>
              <div>
                <span className="block leading-tight">BeanGate</span>
                <span className="block text-[10px] font-normal text-gray-400">IT SOLUTIONS PVT. LTD.</span>
              </div>
            </div>
            <p className="text-sm mb-6">
              We are dedicated to providing quality training and placement assistance to students and helping them build a successful career in IT industry.
            </p>
            <div className="flex gap-4">
              <a
                href={contact.facebookUrl && contact.facebookUrl.trim() ? (contact.facebookUrl.startsWith("http") ? contact.facebookUrl : `https://${contact.facebookUrl}`) : "#"}
                target={contact.facebookUrl && contact.facebookUrl.trim() ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer"
                title="Facebook"
              >
                <FaFacebookF size={14}/>
              </a>
              <a
                href={contact.instagramUrl && contact.instagramUrl.trim() ? (contact.instagramUrl.startsWith("http") ? contact.instagramUrl : `https://${contact.instagramUrl}`) : "#"}
                target={contact.instagramUrl && contact.instagramUrl.trim() ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-pink-600 hover:text-white transition cursor-pointer"
                title="Instagram"
              >
                <FaInstagram size={14}/>
              </a>
              <a
                href={contact.youtubeUrl && contact.youtubeUrl.trim() ? (contact.youtubeUrl.startsWith("http") ? contact.youtubeUrl : `https://${contact.youtubeUrl}`) : "#"}
                target={contact.youtubeUrl && contact.youtubeUrl.trim() ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-red-600 hover:text-white transition cursor-pointer"
                title="YouTube"
              >
                <FaYoutube size={14}/>
              </a>
              <a
                href={contact.linkedinUrl && contact.linkedinUrl.trim() ? (contact.linkedinUrl.startsWith("http") ? contact.linkedinUrl : `https://${contact.linkedinUrl}`) : "#"}
                target={contact.linkedinUrl && contact.linkedinUrl.trim() ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:bg-blue-700 hover:text-white transition cursor-pointer"
                title="LinkedIn"
              >
                <FaLinkedinIn size={14}/>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition">Home</a></li>
              <li><a href="#" className="hover:text-white transition">Course</a></li>
              <li><a href="#" className="hover:text-white transition">Projects</a></li>
              <li><a href="#" className="hover:text-white transition">Trainer</a></li>
              <li><a href="#" className="hover:text-white transition">Reviews</a></li>
              <li><Link to="/admin" className="text-orange-400 hover:text-orange-300 font-bold transition">Login →</Link></li>
            </ul>
          </div>
          
          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <FaGlobe className="mt-1 text-blue-500 shrink-0" />
                <a href="https://www.beangates.com" target="_blank" rel="noreferrer" className="hover:text-white transition font-medium">
                  www.beangates.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FaEnvelope className="mt-1 text-blue-500 shrink-0" />
                <div className="flex flex-col gap-1">
                  {emailText.split(/[\n,]/).map((emailItem, idx) => {
                    const trimmed = emailItem.trim();
                    if (!trimmed) return null;
                    return (
                      <a key={idx} href={`mailto:${trimmed}`} className="hover:text-white transition break-all font-medium block">
                        {trimmed}
                      </a>
                    );
                  })}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaPhoneAlt className="mt-1 text-blue-500 shrink-0" />
                <div className="flex flex-col gap-1">
                  {phoneText.split(/[\n,]/).map((phoneNum, idx) => {
                    const trimmed = phoneNum.trim();
                    if (!trimmed) return null;
                    const cleanNumber = trimmed.replace(/[^0-9+]/g, "");
                    return (
                      <a key={idx} href={`tel:${cleanNumber}`} className="hover:text-white transition font-medium block">
                        {trimmed}
                      </a>
                    );
                  })}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 text-blue-500 shrink-0" />
                <span className="whitespace-pre-line leading-relaxed font-medium">{addressText}</span>
              </li>
            </ul>
          </div>
          
          {/* Subscription */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider mb-6">Subscribe</h4>
            <p className="text-sm mb-4">Get updates about new batches and special offers.</p>
            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-md text-sm focus:outline-none focus:border-blue-500" />
              <button type="submit" className="bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition">SUBSCRIBE</button>
            </form>
          </div>
          
        </div>
        
        <div className="border-t border-gray-800 pt-6 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} BeanGate IT Solutions Pvt. Ltd. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
