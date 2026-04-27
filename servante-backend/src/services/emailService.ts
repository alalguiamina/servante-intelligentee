import nodemailer from 'nodemailer';

type MailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
};

type UserMailInfo = {
  fullName: string;
  email: string;
};

type ToolMailInfo = {
  name: string;
  drawer?: string | null;
};

type BorrowMailInfo = {
  borrowDate?: Date;
  dueDate?: Date;
  returnDate?: Date | null;
};

const formatDate = (date?: Date | null) => {
  if (!date) return 'Non précisée';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(date));
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  async sendMail(payload: MailPayload): Promise<void> {
    const recipients = Array.isArray(payload.to) ? payload.to.filter(Boolean) : payload.to;
    if (Array.isArray(recipients) && recipients.length === 0) return;

    const transporter = this.getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'Servante Intelligente <no-reply@servante.local>';

    if (!transporter) {
      console.log('[EMAIL:DEV]', {
        to: recipients,
        subject: payload.subject,
        text: payload.text,
      });
      return;
    }

    await transporter.sendMail({
      from,
      to: recipients,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  async safeSendMail(payload: MailPayload): Promise<void> {
    try {
      await this.sendMail(payload);
    } catch (error) {
      console.warn('Erreur envoi email:', error instanceof Error ? error.message : error);
    }
  }

  sendBorrowConfirmation(user: UserMailInfo, tool: ToolMailInfo, borrow: BorrowMailInfo) {
    const drawerLine = tool.drawer ? `Tiroir : ${tool.drawer}` : 'Tiroir : non précisé';
    const subject = `Confirmation d'emprunt - ${tool.name}`;
    const text = [
      `Bonjour ${user.fullName},`,
      '',
      `Votre emprunt a bien été confirmé.`,
      '',
      `Outil emprunté : ${tool.name}`,
      drawerLine,
      `Date d'emprunt : ${formatDate(borrow.borrowDate)}`,
      `Date limite de retour : ${formatDate(borrow.dueDate)}`,
      '',
      `Merci de retourner l'outil à temps et en bon état.`,
      '',
      `L'équipe de la servante intelligente`,
    ].join('\n');

    const html = `
      <p>Bonjour ${escapeHtml(user.fullName)},</p>
      <p>Votre emprunt a bien été confirmé.</p>
      <ul>
        <li><strong>Outil emprunté :</strong> ${escapeHtml(tool.name)}</li>
        <li><strong>Tiroir :</strong> ${escapeHtml(tool.drawer || 'non précisé')}</li>
        <li><strong>Date d'emprunt :</strong> ${escapeHtml(formatDate(borrow.borrowDate))}</li>
        <li><strong>Date limite de retour :</strong> ${escapeHtml(formatDate(borrow.dueDate))}</li>
      </ul>
      <p>Merci de retourner l'outil à temps et en bon état.</p>
      <p>L'équipe de la servante intelligente</p>
    `;

    return this.safeSendMail({ to: user.email, subject, text, html });
  }

  sendReturnConfirmation(user: UserMailInfo, tool: ToolMailInfo, borrow: BorrowMailInfo) {
    const subject = `Confirmation de retour - ${tool.name}`;
    const text = [
      `Bonjour ${user.fullName},`,
      '',
      `Le retour de votre outil a bien été confirmé.`,
      '',
      `Outil retourné : ${tool.name}`,
      `Tiroir : ${tool.drawer || 'non précisé'}`,
      `Date de retour : ${formatDate(borrow.returnDate)}`,
      '',
      `Merci d'avoir utilisé la servante intelligente.`,
      '',
      `L'équipe de la servante intelligente`,
    ].join('\n');

    const html = `
      <p>Bonjour ${escapeHtml(user.fullName)},</p>
      <p>Le retour de votre outil a bien été confirmé.</p>
      <ul>
        <li><strong>Outil retourné :</strong> ${escapeHtml(tool.name)}</li>
        <li><strong>Tiroir :</strong> ${escapeHtml(tool.drawer || 'non précisé')}</li>
        <li><strong>Date de retour :</strong> ${escapeHtml(formatDate(borrow.returnDate))}</li>
      </ul>
      <p>Merci d'avoir utilisé la servante intelligente.</p>
      <p>L'équipe de la servante intelligente</p>
    `;

    return this.safeSendMail({ to: user.email, subject, text, html });
  }

  sendExtraToolsWarning(user: UserMailInfo, expectedToolName: string, extraToolNames: string[], drawer?: string | null) {
    const extraTools = extraToolNames.length > 0 ? extraToolNames.join(', ') : 'outil supplémentaire non identifié';
    const subject = `Avertissement - outil(s) non autorisé(s) détecté(s)`;
    const text = [
      `Bonjour ${user.fullName},`,
      '',
      `Un retrait non conforme a été détecté pendant votre opération d'emprunt.`,
      '',
      `Outil autorisé : ${expectedToolName}`,
      `Outil(s) supplémentaire(s) détecté(s) : ${extraTools}`,
      `Tiroir : ${drawer || 'non précisé'}`,
      '',
      `Vous devez remettre immédiatement tout outil qui n'était pas prévu dans l'emprunt.`,
      `Cet avertissement a également été envoyé à l'administrateur.`,
      '',
      `L'équipe de la servante intelligente`,
    ].join('\n');

    const html = `
      <p>Bonjour ${escapeHtml(user.fullName)},</p>
      <p>Un retrait non conforme a été détecté pendant votre opération d'emprunt.</p>
      <ul>
        <li><strong>Outil autorisé :</strong> ${escapeHtml(expectedToolName)}</li>
        <li><strong>Outil(s) supplémentaire(s) détecté(s) :</strong> ${escapeHtml(extraTools)}</li>
        <li><strong>Tiroir :</strong> ${escapeHtml(drawer || 'non précisé')}</li>
      </ul>
      <p>Vous devez remettre immédiatement tout outil qui n'était pas prévu dans l'emprunt.</p>
      <p>Cet avertissement a également été envoyé à l'administrateur.</p>
      <p>L'équipe de la servante intelligente</p>
    `;

    return this.safeSendMail({ to: user.email, subject, text, html });
  }

  sendExtraToolsAdminAlert(adminEmails: string[], user: UserMailInfo, expectedToolName: string, extraToolNames: string[], drawer?: string | null) {
    const extraTools = extraToolNames.length > 0 ? extraToolNames.join(', ') : 'outil supplémentaire non identifié';
    const subject = `Alerte servante - retrait non autorisé par ${user.fullName}`;
    const text = [
      `Bonjour,`,
      '',
      `Un utilisateur a pris plus d'outils que prévu.`,
      '',
      `Utilisateur : ${user.fullName}`,
      `Email : ${user.email}`,
      `Outil autorisé : ${expectedToolName}`,
      `Outil(s) supplémentaire(s) détecté(s) : ${extraTools}`,
      `Tiroir : ${drawer || 'non précisé'}`,
      `Date : ${formatDate(new Date())}`,
      '',
      `Merci de vérifier l'incident.`,
      '',
      `Servante intelligente`,
    ].join('\n');

    const html = `
      <p>Bonjour,</p>
      <p>Un utilisateur a pris plus d'outils que prévu.</p>
      <ul>
        <li><strong>Utilisateur :</strong> ${escapeHtml(user.fullName)}</li>
        <li><strong>Email :</strong> ${escapeHtml(user.email)}</li>
        <li><strong>Outil autorisé :</strong> ${escapeHtml(expectedToolName)}</li>
        <li><strong>Outil(s) supplémentaire(s) détecté(s) :</strong> ${escapeHtml(extraTools)}</li>
        <li><strong>Tiroir :</strong> ${escapeHtml(drawer || 'non précisé')}</li>
        <li><strong>Date :</strong> ${escapeHtml(formatDate(new Date()))}</li>
      </ul>
      <p>Merci de vérifier l'incident.</p>
      <p>Servante intelligente</p>
    `;

    return this.safeSendMail({ to: adminEmails, subject, text, html });
  }
}

export const emailService = new EmailService();
