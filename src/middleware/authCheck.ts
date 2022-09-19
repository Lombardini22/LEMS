import {ref} from 'vue'

const authCheck = () =>{
  const isAuth = ref(false)
  const check = () => {
    const token = localStorage.getItem('user')
    if (token) {
      isAuth.value = true
    }
  }
  return {isAuth, check}
}

export default authCheck