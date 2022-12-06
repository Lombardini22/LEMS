<template>
  <ion-page class="ion-page">
    <ion-header>
      <!-- <ion-toolbar color="primary">
        <ion-title>Login</ion-title>
      </ion-toolbar> -->
    </ion-header>
    <ion-content class="content">
      
        <div class="login-logo">
          <img src="/assets/logos/title_cp_print.png" alt="logo" />
        </div>

        <!-- <form novalidate> -->
        <div class="form">
          <ion-list>
            <ion-item>
              <ion-label position="stacked" color="primary">Username</ion-label>
              <ion-input v-model="username" name="username" type="text" autocapitalize="off" required></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked" color="primary">Password</ion-label>
              <ion-input v-model="password" name="password" type="password" required></ion-input>
            </ion-item>
          </ion-list>

          <ion-row responsive-sm>
            <ion-col>
              <ion-button type="submit" expand="block" @click="onLogin"> Login</ion-button>
            </ion-col>
            <!-- <ion-col>
            <ion-button color="light" expand="block" @click="onSignup">
              Signup</ion-button
            >
          </ion-col> -->
          </ion-row>
        </div>
        <!-- </form> -->
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  IonButton,
  IonCol,
  IonHeader,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
} from "@ionic/vue";
import axios from "axios";
import { ref } from "vue";

const username = ref("");
const password = ref("");
const submitted = ref(false);
const userValid = ref(false);

const onLogin = () => {
  submitted.value = true;
  axios
    .post(process.env.VUE_APP_SERVER_URL + "api/users/login", {
      username: username.value,
      password: password.value,
    })
    .then((res) => {
      console.log(res);
      if (res.status == 200) {
        userValid.value = true;
        console.log("User Valid");
        localStorage.setItem("user", res.data.accessToken);
        setTimeout(() => {
          window.location.href = "/lems/management";
        }, 1000);
      } else {
        userValid.value = false;
        console.log("User Invalid");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

</script>

<style scoped>
.login-logo {
  padding: 20px 0;
  min-height: 200px;
  text-align: center;
  padding-top:50px;
  margin-top: 50px;
}

.login-logo img {
  max-width: 150px;
}


.list {
  margin-bottom: 0;
}

form {
  margin: 0;
  font: inherit;
  color: inherit;
  display: flex;
  align-content: center;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
