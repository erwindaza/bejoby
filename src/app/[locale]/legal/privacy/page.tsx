// src/app/[locale]/legal/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad · BeJoby",
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <main className="min-h-screen py-28 px-4">
      <article className="max-w-3xl mx-auto prose prose-invert prose-purple">
        <h1>{isEs ? "Política de Privacidad" : "Privacy Policy"}</h1>
        <p className="text-sm text-gray-400">
          {isEs ? "Última actualización: marzo 2026" : "Last updated: March 2026"}
        </p>

        <h2>{isEs ? "1. Responsable del tratamiento" : "1. Data Controller"}</h2>
        <p>
          {isEs
            ? "BeJoby (en adelante, \"la Plataforma\") es responsable del tratamiento de los datos personales recopilados a través de este sitio web."
            : "BeJoby (hereinafter, \"the Platform\") is the data controller responsible for personal data collected through this website."}
        </p>

        <h2>{isEs ? "2. Datos que recopilamos" : "2. Data We Collect"}</h2>
        <p>{isEs ? "Recopilamos los siguientes datos personales:" : "We collect the following personal data:"}</p>
        <ul>
          <li>
            <strong>{isEs ? "Candidatos:" : "Candidates:"}</strong>{" "}
            {isEs
              ? "Nombre, email, teléfono, perfil de LinkedIn, currículum vitae (texto), idioma preferido."
              : "Name, email, phone, LinkedIn profile, curriculum vitae (text), preferred language."}
          </li>
          <li>
            <strong>{isEs ? "Empresas:" : "Companies:"}</strong>{" "}
            {isEs
              ? "Nombre de la empresa, persona de contacto, email, teléfono, sitio web, industria, descripción."
              : "Company name, contact person, email, phone, website, industry, description."}
          </li>
          <li>
            <strong>{isEs ? "Postulaciones:" : "Applications:"}</strong>{" "}
            {isEs
              ? "Datos del candidato, mensaje de postulación, CV adjunto."
              : "Candidate data, application message, attached CV."}
          </li>
          <li>
            <strong>{isEs ? "Contacto:" : "Contact:"}</strong>{" "}
            {isEs
              ? "Nombre, email, mensaje enviado a través del formulario de contacto."
              : "Name, email, message sent through the contact form."}
          </li>
        </ul>

        <h2>{isEs ? "3. Finalidad del tratamiento" : "3. Purpose of Processing"}</h2>
        <ul>
          <li>{isEs ? "Conectar candidatos con ofertas laborales." : "Connect candidates with job opportunities."}</li>
          <li>{isEs ? "Permitir a las empresas publicar ofertas y revisar postulaciones." : "Allow companies to post jobs and review applications."}</li>
          <li>{isEs ? "Generar CVs en formato Harvard usando inteligencia artificial." : "Generate Harvard format CVs using artificial intelligence."}</li>
          <li>{isEs ? "Ofrecer servicios de coaching y empleabilidad." : "Provide coaching and employability services."}</li>
          <li>{isEs ? "Comunicarnos contigo sobre tu cuenta y los servicios." : "Communicate with you about your account and services."}</li>
        </ul>

        <h2>{isEs ? "4. Base legal" : "4. Legal Basis"}</h2>
        <p>
          {isEs
            ? "El tratamiento de tus datos se basa en tu consentimiento explícito, otorgado al registrarte o postular. Puedes retirar tu consentimiento en cualquier momento contactándonos."
            : "The processing of your data is based on your explicit consent, given when registering or applying. You can withdraw your consent at any time by contacting us."}
        </p>

        <h2>{isEs ? "5. Compartición de datos" : "5. Data Sharing"}</h2>
        <p>
          {isEs
            ? "Cuando un candidato postula a una oferta laboral y otorga su consentimiento expreso, sus datos (nombre, email, CV) serán compartidos con la empresa que publicó la oferta. No vendemos datos personales a terceros."
            : "When a candidate applies to a job and gives explicit consent, their data (name, email, CV) will be shared with the company that posted the job. We do not sell personal data to third parties."}
        </p>

        <h2>{isEs ? "6. Almacenamiento y seguridad" : "6. Storage and Security"}</h2>
        <p>
          {isEs
            ? "Los datos se almacenan en servidores de Google Cloud Platform (GCP) en Estados Unidos, con cifrado en tránsito y en reposo. Implementamos medidas técnicas y organizativas para proteger tus datos."
            : "Data is stored on Google Cloud Platform (GCP) servers in the United States, with encryption in transit and at rest. We implement technical and organizational measures to protect your data."}
        </p>

        <h2>{isEs ? "7. Generación de CV con IA" : "7. AI CV Generation"}</h2>
        <p>
          {isEs
            ? "Cuando utilizas nuestro generador de CV Harvard, el texto de tu CV es enviado a Google Gemini para su procesamiento. El texto procesado no se almacena de forma permanente en nuestros servidores después de la generación."
            : "When you use our Harvard CV generator, your CV text is sent to Google Gemini for processing. The processed text is not permanently stored on our servers after generation."}
        </p>

        <h2>{isEs ? "8. Tus derechos" : "8. Your Rights"}</h2>
        <p>{isEs ? "Tienes derecho a:" : "You have the right to:"}</p>
        <ul>
          <li>{isEs ? "Acceder a tus datos personales." : "Access your personal data."}</li>
          <li>{isEs ? "Rectificar datos inexactos." : "Rectify inaccurate data."}</li>
          <li>{isEs ? "Solicitar la eliminación de tus datos." : "Request deletion of your data."}</li>
          <li>{isEs ? "Retirar tu consentimiento." : "Withdraw your consent."}</li>
          <li>{isEs ? "Portar tus datos a otro servicio." : "Port your data to another service."}</li>
          <li>{isEs ? "Oponerte al tratamiento." : "Object to processing."}</li>
        </ul>

        <h2>{isEs ? "9. Retención de datos" : "9. Data Retention"}</h2>
        <p>
          {isEs
            ? "Conservamos tus datos mientras tu cuenta esté activa o mientras sea necesario para prestarte servicios. Puedes solicitar la eliminación en cualquier momento."
            : "We retain your data while your account is active or as necessary to provide services. You can request deletion at any time."}
        </p>

        <h2>{isEs ? "10. Contacto" : "10. Contact"}</h2>
        <p>
          {isEs
            ? "Para ejercer tus derechos o consultas sobre privacidad:"
            : "To exercise your rights or for privacy inquiries:"}
        </p>
        <p>
          📧 privacy@bejoby.com<br />
          {isEs ? "O a través de nuestro" : "Or through our"}{" "}
          <Link href={`/${locale}/contacto`} className="text-purple-400 hover:text-purple-300">
            {isEs ? "formulario de contacto" : "contact form"}
          </Link>.
        </p>

        <h2>{isEs ? "11. Cookies" : "11. Cookies"}</h2>
        <p>
          {isEs
            ? "Utilizamos cookies analíticas de Vercel para medir el rendimiento del sitio. No utilizamos cookies de rastreo publicitario."
            : "We use Vercel analytics cookies to measure site performance. We do not use advertising tracking cookies."}
        </p>

        <h2>{isEs ? "12. Cambios a esta política" : "12. Changes to This Policy"}</h2>
        <p>
          {isEs
            ? "Nos reservamos el derecho de actualizar esta política. Los cambios serán publicados en esta página con la fecha de actualización."
            : "We reserve the right to update this policy. Changes will be posted on this page with the update date."}
        </p>
      </article>
    </main>
  );
}
