import { PersonaDTO } from "./PersonaDTO";

export interface UsuarioDTO {
  username: string;
  email: string;
  persona:PersonaDTO
}
