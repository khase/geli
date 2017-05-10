/** Created by Oliver Neff on 14.04.2017. */
import {Component, Input, OnInit} from '@angular/core';
import {CourseService, UserDataService} from '../../../shared/services/data.service';
import {ShowProgressService} from '../../../shared/services/show-progress.service';
import {IUser} from '../../../../../../../shared/models/IUser';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit {
  @Input() courseId;
  course: any;
  members: IUser[] = [];
  users: IUser[] = [];
  filterFirstNameMember = '';
  filterLastNameMember = '';
  filterFirstNameUser = '';
  filterLastNameUser = '';

  constructor(private userService: UserDataService,
              private courseService: CourseService,
              private showProgress: ShowProgressService) {
    this.getStudents();
  }

  ngOnInit() {
    console.log('init course members with course id:');
    console.log(this.courseId);
    this.getCourseMembers();
  }

  /**
   * Save all students in this course in database.
   */
  updateMembersInCourse() {
    this.showProgress.toggleLoadingGlobal(true);
    this.courseService.updateItem({'students': this.course.students, '_id': this.courseId}).then(
      (val) => {
        console.log(val);
        this.showProgress.toggleLoadingGlobal(false);
      }, (error) => {
        this.showProgress.toggleLoadingGlobal(false);
        console.log(error);
      });
  }

  /**
   * Switch a user from student to member and back and update this course in database.
   * @param _id Id of an user.
   * @param direction direction where user to switch.
   */
  switchUser(id: string, direction: string) {
    if (direction === 'right') {
      this.members = this.members.concat(this.users.filter(obj => id === obj._id));
      this.users = this.users.filter(obj => !(id === obj._id));
    } else if (direction === 'left') {
      this.users = this.users.concat(this.members.filter(obj => id === obj._id));
      this.members = this.members.filter(obj => !(id === obj._id));
    }
    this.sortUsers(this.members);
    this.sortUsers(this.users);
    this.course.students = this.members;
    this.updateMembersInCourse();
  }

  /**
   * Get all users from api and filter those role student.
   */
  getStudents() {
    this.userService.readItems().then(users => {
      this.users = users.filter(obj => obj.role === 'student');
    });
    this.sortUsers(this.members);
  }

  /**
   * Get this course from api and filter all members from users.
   */
  getCourseMembers() {
    this.courseService.readSingleItem(this.courseId).then(
      (val: any) => {
        this.course = val;
        this.members = this.course.students;

        this.members.forEach(member =>
          this.users = this.users.filter(function (user) {
            return user._id !== member._id;
          }));
        this.sortUsers(this.users);
      }, (error) => {
        console.log(error);
      });
  }

  /**
   * Sort an array of users alphabeticaly after firstname and lastname.
   * @param users An array of users.
   */
  sortUsers(users: IUser[]) {
    users.sort(function (a, b) {
      if (a.profile.firstName < b.profile.firstName || a.profile.lastName < b.profile.lastName) {
        return -1;
      }
      if (a.profile.firstName > b.profile.firstName || a.profile.lastName < b.profile.lastName) {
        return 1;
      }
      return 0;
    });
  }
}
