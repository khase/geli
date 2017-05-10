import { Observable } from 'rxjs/Rx';
import { Injectable } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import {ConfirmDialog} from '../components/delete-dialog/confirm-dialog.component';

@Injectable()
export class DialogService {

  constructor(private dialog: MdDialog) { }

  public confirm(title: string, message: string, confirmText: string = 'Confirm'): Observable<boolean> {
    let dialogRef: MdDialogRef<ConfirmDialog>;

    dialogRef = this.dialog.open(ConfirmDialog);
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.confirmText = confirmText;

    return dialogRef.afterClosed();
  }

  public delete(itemType: string, itemName): Observable<boolean> {
    return this.confirm('Delete ' + itemType,
                        'Are you sure you want to delete the ' + itemType + ' ' + itemName,
                        'Delete');
  }
}
