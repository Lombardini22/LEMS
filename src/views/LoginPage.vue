<template>
  <ion-page class="ion-page">
    <ion-header>
      <!-- <ion-toolbar color="primary">
        <ion-title>Login</ion-title>
      </ion-toolbar> -->
    </ion-header>

    <ion-content>
      <div class="login-logo">
        <img src="/assets/logos/logo-foresight-bk.png" alt="Ionic logo" />
      </div>

      <!-- <form novalidate> -->
      <div class="form">
        <ion-list>
          <ion-item>
            <ion-label position="stacked" color="primary">Username</ion-label>
            <ion-input
              v-model="username"
              name="username"
              type="text"
              autocapitalize="off"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked" color="primary">Password</ion-label>
            <ion-input
              v-model="password"
              name="password"
              type="password"
              required
            ></ion-input>
          </ion-item>
        </ion-list>

        <ion-row responsive-sm>
          <ion-col>
            <ion-button type="submit" expand="block" @click="onLogin"> Login</ion-button>
          </ion-col>
          <ion-col>
            <ion-button color="light" expand="block" @click="onSignup">
              Signup</ion-button
            >
          </ion-col>
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
  IonContent,
  IonHeader,
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

const onLogin =  () => {
  submitted.value = true;
axios
    .post("http://localhost:5000/api/users/login", {
      username: username.value,
      password: password.value,
    })
    .then((res) => {
    console.log(res);
    if(res.status == 200){
        userValid.value = true;
        console.log("User Valid");
        localStorage.setItem("user", JSON.stringify(res.data.accessToken));
    }else {
        userValid.value = false;
        console.log("User Invalid");
    }
    })
    .catch((err) => {
      console.log(err);
    });
};

const onSignup = () => {
  console.log("Signup successful");
};
</script>

<style scoped>
.login-logo {
  padding: 20px 0;
  min-height: 200px;
  text-align: center;
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
