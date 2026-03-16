export interface IRegisterPatientPayload {
  email: string;
  name: string;
  password: string;
}

export interface ISignIn {
  email: string;
  password: string;
  callbackURL?: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
