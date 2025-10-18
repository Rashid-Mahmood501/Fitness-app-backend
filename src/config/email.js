import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async (to, templateId, templateData) => {
  const msg = {
    to: to || "ahmad.raza@hashlogics.com",
    from: { email: "ahmad.raza@hashlogics.com", name: "Fitness Admin" },
    templateId: templateId,
    dynamicTemplateData: templateData || {},
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};
