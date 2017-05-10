import {Component, OnInit} from '@angular/core';
import {Validators, FormGroup, FormBuilder} from '@angular/forms';
import {AuthenticationService} from '../../shared/services/authentication.service';
import {Router} from '@angular/router';
import {ShowProgressService} from '../../shared/services/show-progress.service';
import {MdSnackBar} from '@angular/material';
import {matchPasswords} from '../../shared/validators/validators';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  registrationDone = false;

  constructor(private router: Router,
              private authenticationService: AuthenticationService,
              private showProgress: ShowProgressService,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    // reset login status
    this.authenticationService.logout();
    this.generateForm();
  }

  register() {
    this.showProgress.toggleLoadingGlobal(true);
    this.authenticationService.register(this.registerForm.value).then(
      (val) => {
        console.log('register done...' + val);
        this.showProgress.toggleLoadingGlobal(false);
        this.registrationDone = true;
        // window.location.href = '../';
      }, (error) => {
        console.log('registration failed');
        console.log(error);
        this.showProgress.toggleLoadingGlobal(false);
      });
  }

  generateForm() {
    this.registerForm = this.formBuilder.group({
      profile: this.formBuilder.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
      }),
      username: [''],
      email: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, {validator: matchPasswords('password', 'confirmPassword')});
  }

  navigateFront() {
    this.router.navigate(['/']);
  }
}
