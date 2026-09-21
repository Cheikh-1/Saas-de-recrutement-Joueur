/**
 * Helper utility to map Supabase / Postgres error codes & messages into friendly French error messages.
 */
export function getFrenchErrorMessage(error: any): string {
  if (!error) return 'Une erreur inconnue est survenue.'

  const message = typeof error === 'string' ? error : error?.message || error?.error_description || String(error)
  const code = error?.code

  // Check Postgres error codes or message substrings
  if (code === '23505' || message.includes('duplicate key value violates unique constraint') || message.includes('already exists')) {
    if (message.includes('profiles_email_key') || message.includes('email')) {
      return 'Un compte avec cet e-mail existe déjà.'
    }
    return 'Cette donnée existe déjà dans la base de données.'
  }

  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Adresse e-mail ou mot de passe incorrect.'
  }

  if (message.includes('User already registered') || message.includes('email_already_in_use')) {
    return 'Un compte existe déjà avec cette adresse e-mail.'
  }

  if (message.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.'
  }

  if (message.includes('Email not confirmed')) {
    return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.'
  }

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return "Vous n'avez pas les autorisations nécessaires pour effectuer cette action."
  }

  if (message.includes('Bucket not found') || message.includes('bucket_not_found')) {
    return "Le bucket de stockage 'avatars' n'existe pas encore sur votre projet Supabase. Veuillez créer le bucket 'avatars' (en cochant 'Public bucket') dans l'onglet Storage de votre tableau de bord Supabase."
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('network')) {
    return 'Impossible de contacter le serveur. Veuillez vérifier votre connexion Internet.'
  }

  // Default fallback to raw message if it's already customized, or generic message if it looks too technical
  if (message.toLowerCase().includes('violates') || message.includes('SQL') || message.includes('FK_')) {
    return "Une erreur technique s'est produite lors du traitement de votre demande."
  }

  return message
}
