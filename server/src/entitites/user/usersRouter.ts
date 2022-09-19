import { Router } from '../../routing/Router'
import { loginUser, loginUserPath } from './loginUser'

export const usersRouter = Router.make('/users').post(loginUserPath, loginUser)
