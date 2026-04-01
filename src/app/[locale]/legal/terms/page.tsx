// src/app/[locale]/legal/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Términos de Servicio · BeJoby",
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <main className="min-h-screen py-28 px-4">
      <article className="max-w-3xl mx-auto prose prose-invert prose-purple">
        <h1>{isEs ? "Términos y Condiciones de Uso" : "Terms and Conditions of Use"}</h1>
        <p className="text-sm text-gray-400">
          {isEs ? "Última actualización: marzo 2026" : "Last updated: March 2026"}
        </p>

        <h2>{isEs ? "1. Aceptación de los términos" : "1. Acceptance of Terms"}</h2>
        <p>
          {isEs
            ? "Al acceder y utilizar BeJoby, aceptas estos Términos y Condiciones. Si no estás de acuerdo, no utilices la plataforma."
            : "By accessing and using BeJoby, you accept these Terms and Conditions. If you disagree, do not use the platform."}
        </p>

        <h2>{isEs ? "2. Descripción del servicio" : "2. Service Description"}</h2>
        <p>
          {isEs
            ? "BeJoby es una plataforma que conecta candidatos con empresas a través de ofertas laborales, coaching y herramientas de empleabilidad como el generador de CV Harvard."
            : "BeJoby is a platform that connects candidates with companies through job listings, coaching, and employability tools like the Harvard CV generator."}
        </p>

        <h2>{isEs ? "3. Registro y cuentas" : "3. Registration and Accounts"}</h2>
        <ul>
          <li>{isEs ? "Debes proporcionar información veraz y actualizada." : "You must provide truthful and up-to-date information."}</li>
          <li>{isEs ? "Eres responsable de mantener la confidencialidad de tu cuenta." : "You are responsible for maintaining account confidentiality."}</li>
          <li>{isEs ? "No puedes crear cuentas falsas o con información fraudulenta." : "You cannot create fake accounts or provide fraudulent information."}</li>
        </ul>

        <h2>{isEs ? "4. Uso aceptable" : "4. Acceptable Use"}</h2>
        <p>{isEs ? "Queda prohibido:" : "The following is prohibited:"}</p>
        <ul>
          <li>{isEs ? "Publicar ofertas laborales falsas o engañosas." : "Post fake or misleading job listings."}</li>
          <li>{isEs ? "Usar la plataforma para spam o phishing." : "Use the platform for spam or phishing."}</li>
          <li>{isEs ? "Recopilar datos de otros usuarios sin su consentimiento." : "Collect data from other users without consent."}</li>
          <li>{isEs ? "Infringir derechos de propiedad intelectual." : "Infringe intellectual property rights."}</li>
          <li>{isEs ? "Discriminar por raza, género, edad, religión, orientación sexual o cualquier otra condición protegida." : "Discriminate based on race, gender, age, religion, sexual orientation, or any other protected condition."}</li>
        </ul>

        <h2>{isEs ? "5. Ofertas laborales" : "5. Job Listings"}</h2>
        <ul>
          <li>{isEs ? "Las empresas son responsables del contenido de sus ofertas." : "Companies are responsible for the content of their listings."}</li>
          <li>{isEs ? "Las ofertas deben cumplir con la legislación laboral vigente." : "Listings must comply with applicable labor laws."}</li>
          <li>{isEs ? "BeJoby se reserva el derecho de eliminar ofertas que incumplan estos términos." : "BeJoby reserves the right to remove listings that violate these terms."}</li>
          <li>{isEs ? "Las ofertas no deben incluir requisitos discriminatorios." : "Listings must not include discriminatory requirements."}</li>
        </ul>

        <h2>{isEs ? "6. Datos de candidatos" : "6. Candidate Data"}</h2>
        <ul>
          <li>{isEs ? "Los CVs y datos personales de los candidatos solo pueden ser utilizados para el proceso de selección para el cual fueron compartidos." : "Candidate CVs and personal data may only be used for the selection process for which they were shared."}</li>
          <li>{isEs ? "Las empresas no pueden compartir los datos de candidatos con terceros sin su consentimiento." : "Companies cannot share candidate data with third parties without consent."}</li>
          <li>{isEs ? "Está prohibido contactar a candidatos fuera del contexto de una oferta activa." : "Contacting candidates outside the context of an active listing is prohibited."}</li>
        </ul>

        <h2>{isEs ? "7. Generador de CV con IA" : "7. AI CV Generator"}</h2>
        <ul>
          <li>{isEs ? "El CV generado es una sugerencia. El usuario es responsable de verificar y aprobar el contenido final." : "The generated CV is a suggestion. The user is responsible for verifying and approving the final content."}</li>
          <li>{isEs ? "BeJoby no garantiza que el formato genere resultados específicos en procesos de selección." : "BeJoby does not guarantee the format will generate specific results in selection processes."}</li>
          <li>{isEs ? "No almacenamos de forma permanente los CVs procesados por la IA." : "We do not permanently store CVs processed by AI."}</li>
        </ul>

        <h2>{isEs ? "8. Propiedad intelectual" : "8. Intellectual Property"}</h2>
        <p>
          {isEs
            ? "Todo el contenido de BeJoby (diseño, código, marca) es propiedad de BeJoby. Los usuarios retienen los derechos sobre sus datos personales y CVs."
            : "All BeJoby content (design, code, brand) is the property of BeJoby. Users retain rights over their personal data and CVs."}
        </p>

        <h2>{isEs ? "9. Limitación de responsabilidad" : "9. Limitation of Liability"}</h2>
        <p>
          {isEs
            ? "BeJoby actúa como intermediario y no es responsable de las decisiones de contratación de las empresas ni de la veracidad de la información proporcionada por los usuarios."
            : "BeJoby acts as an intermediary and is not responsible for hiring decisions by companies or the truthfulness of information provided by users."}
        </p>

        <h2>{isEs ? "10. Terminación" : "10. Termination"}</h2>
        <p>
          {isEs
            ? "BeJoby puede suspender o cancelar cuentas que violen estos términos. Los usuarios pueden eliminar su cuenta en cualquier momento contactándonos."
            : "BeJoby may suspend or cancel accounts that violate these terms. Users can delete their account at any time by contacting us."}
        </p>

        <h2>{isEs ? "11. Modificaciones" : "11. Modifications"}</h2>
        <p>
          {isEs
            ? "Nos reservamos el derecho de modificar estos términos. Los cambios serán publicados en esta página."
            : "We reserve the right to modify these terms. Changes will be posted on this page."}
        </p>

        <h2>{isEs ? "12. Ley aplicable" : "12. Applicable Law"}</h2>
        <p>
          {isEs
            ? "Estos términos se rigen por la legislación chilena. Cualquier controversia será resuelta ante los tribunales competentes de Santiago, Chile."
            : "These terms are governed by Chilean law. Any disputes will be resolved before the competent courts of Santiago, Chile."}
        </p>

        <h2>{isEs ? "13. Contacto" : "13. Contact"}</h2>
        <p>
          📧 contacto@bejoby.com<br />
          <Link href={`/${locale}/contacto`} className="text-purple-400 hover:text-purple-300">
            {isEs ? "Formulario de contacto" : "Contact form"}
          </Link>
        </p>
      </article>
    </main>
  );
}
