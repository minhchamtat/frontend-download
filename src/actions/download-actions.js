import {
  Action,
  AsyncAction,
  Actions,
  Inject,
} from 'anglue/anglue';

import './../resources/download-resource';

@Actions()
export class DownloadActions {
  @Inject() $q;
  @Inject() downloadResource;

  @AsyncAction()
  generateDownloadLinksForRuns(runs, fileTypes) {
    const runPromises = [];

    runs.forEach(run => {
      runPromises.push(this.generateDownloadLinksForRun(run, fileTypes));
    });

    return this.$q.all(runPromises);
  }

  @AsyncAction()
  generateDownloadLinksForRun(run, fileTypes) {
    const now = new Date().getTime();
    const filePromises = [];
    const filesToDownload = run.files.filter(file => {
      // List of filetypes that need to be downloaded has been given
      // ignore the selected property
      if (fileTypes && fileTypes[file.name] && !file.link ||
          fileTypes && fileTypes[file.name] && now - file.linkTimestamp > 300000) {
        return true;
      }

      // Only generate link if no link yet or link is older then 5 minutes
      return file.selected && !file.link || file.selected && now - file.linkTimestamp > 300000;
    });

    if (filesToDownload.length > 0) {

      // Generate link for each file
      filesToDownload.forEach(file => {
        file.link = undefined;
        filePromises.push(this.generateDownloadLink(file));
      });

      return this.$q.all(filePromises).then(() => {
        return run;
      });
    }

    return this.$q.resolve(run);
  }

  @AsyncAction()
  generateDownloadLink(file) {
    return this.downloadResource.download({
      fileId: file.fileid
    }).$promise.then(link => {
      return {
        file,
        link
      };
    });
  }

  @Action()
  download(files, fileTypes) {
    files.forEach(file => {
      if (fileTypes && fileTypes[file.name] || !fileTypes && file.selected) {
        const iframe = document.createElement('iframe');
        iframe.src = file.link;

        iframe.onload = () => {
          document.body.removeChild(iframe);
        };

        document.body.appendChild(iframe);
      }
    });
  }
}

export default DownloadActions;
