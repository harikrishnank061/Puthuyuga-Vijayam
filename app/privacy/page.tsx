'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowLeft, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col auth-page-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        
        {/* Navigation / Header Bar */}
        <div className="flex justify-between items-center bg-white/90 backdrop-blur-md shadow-md border-b-4 border-[#C31F26] p-4 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F2D409] to-[#D4A017] rounded-full flex items-center justify-center border border-[#C31F26] shadow-sm">
              <Building2 className="h-4 w-4 text-[#C31F26]" />
            </div>
            <span className="font-bold text-lg text-[#C31F26]" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              புதுயுக விஜயம்
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 font-semibold text-xs border-[#C31F26]/30 text-[#C31F26] hover:bg-[#C31F26]/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </div>

        {/* Policy Content Card */}
        <Card className="shadow-2xl border-[#C31F26]/15 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-[#FDF5E6] to-[#FAE9C8] px-6 py-5 border-b border-[#C31F26]/10 flex flex-row items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-[#C31F26]" />
            <CardTitle className="text-xl font-bold text-[#6B1D1D]">
              Privacy Policy for Puthuyuga Vijayam
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6 text-sm text-[#3D1515]/90 leading-relaxed text-justify">
            <p className="font-semibold text-[#8B3A3A] border-b pb-2">Effective Date: June 3, 2026</p>
            
            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">1. Introduction</h3>
              <p>
                Puthuyuga Vijayam (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is a civic issue reporting and resolution platform designed to help citizens report public infrastructure and service-related issues to relevant government departments.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, store, and protect information when you use our mobile application and related services.
              </p>
              <p>
                By using Puthuyuga Vijayam, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">2. Information We Collect</h3>
              <div className="space-y-3 pl-2">
                <p><strong>a) Location Information:</strong> When reporting an issue, the App may collect your device&apos;s location (GPS coordinates) to accurately identify the issue location. Location data is collected only when you submit a complaint or use location-based features.</p>
                <p><strong>b) Photos and Media:</strong> The App allows users to upload photographs of public issues such as damaged roads, water leaks, sanitation concerns, and other civic problems. These images are stored on our servers and shared with relevant authorities for resolution purposes.</p>
                <p><strong>c) User Information:</strong> Depending on the features enabled, we may collect: Name, Mobile Number, Email Address, User ID, and Complaint History.</p>
                <p><strong>d) Device Information:</strong> We may automatically collect device model, operating system version, application version, device identifiers, and crash reports/diagnostics.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">3. How We Use Your Information</h3>
              <p>We use collected information to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Register and manage complaints</li>
                <li>Route complaints to the appropriate department</li>
                <li>Display issue locations on maps</li>
                <li>Track complaint status</li>
                <li>Send notifications and updates</li>
                <li>Improve application performance</li>
                <li>Generate governance reports and analytics</li>
                <li>Prevent misuse and fraudulent activities</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">4. Sharing of Information</h3>
              <div className="space-y-3 pl-2">
                <p><strong>Government Departments:</strong> Complaint details, uploaded photos, descriptions, and locations may be shared with authorized government departments responsible for resolving the reported issue.</p>
                <p><strong>Service Providers:</strong> We may use third-party services for cloud hosting, analytics, notification delivery, and application monitoring. These providers are required to protect your information.</p>
                <p><strong>Legal Requirements:</strong> Information may be disclosed if required by law, court order, government request, or to protect public safety.</p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">5. Publicly Visible Information</h3>
              <p>
                Issue reports may be displayed publicly within the application to improve transparency and accountability. Publicly visible information may include: Issue description, uploaded photos, issue location, and complaint status. Personal contact information will not be publicly displayed without your consent.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">6. Data Retention</h3>
              <p>
                We retain complaint and account information only for as long as necessary to provide services, maintain records, comply with legal obligations, and support governance reporting. After the retention period, data may be securely deleted or anonymized.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">7. Data Security</h3>
              <p>
                We implement reasonable administrative, technical, and physical safeguards to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no internet-based system can guarantee complete security.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">8. Children&apos;s Privacy</h3>
              <p>
                Puthuyuga Vijayam is not specifically directed toward children under 13 years of age. We do not knowingly collect personal information from children under 13. If such information is discovered, it will be removed promptly.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">9. User Rights</h3>
              <p>
                Users may have the right to access their information, correct inaccurate information, request deletion of their data, or withdraw consent where applicable. Requests can be submitted using the contact details below.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">10. Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. Changes will be posted within the application and on our website. Continued use of the App after updates constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-bold text-base text-[#6B1D1D]">11. Contact Us</h3>
              <p>For any questions regarding this Privacy Policy, contact:</p>
              <div className="mt-2 p-4 bg-[#FDF5E6]/60 border border-[#C31F26]/10 rounded-xl space-y-1">
                <p className="font-bold text-[#6B1D1D]">Puthuyuga Vijayam Support Team</p>
                <p>Email: <a href="mailto:support@puthuyugavijayam.in" className="text-[#C31F26] hover:underline">support@puthuyugavijayam.in</a></p>
                <p>Website: <a href="https://puthuyugavijayam.in" target="_blank" rel="noopener noreferrer" className="text-[#C31F26] hover:underline">puthuyugavijayam.in</a></p>
                <p>Address: Municipality Office Road, Rajapalayam, Virudhunagar District, Tamil Nadu, India</p>
              </div>
            </section>

            <section className="space-y-2 pt-2 border-t border-[#C31F26]/10">
              <h3 className="font-bold text-base text-[#6B1D1D]">12. Consent</h3>
              <p>
                By installing and using Puthuyuga Vijayam, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-[#8B3A3A]/60 pb-6">
          &copy; {new Date().getFullYear()} Rajapalayam Municipality. All rights reserved.
        </div>
      </div>
    </div>
  );
}
