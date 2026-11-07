'use strict';

const paduserlist = require('ep_etherpad-lite/static/js/pad_userlist').paduserlist;
const padutils = require('ep_etherpad-lite/static/js/pad_utils').padutils;

const renderUserCountElement = () => $('#editbar [data-key=epCitizenOSUserListToggle] > a').append('<span id="epCitizenOSUserListToggleCount">1</span>');
const isUserCountElement = () => $('#epCitizenOSUserListToggleCount').length > 0;

const renderUserCount = (count) => {
  if (!isUserCountElement()) { // Does not exist, add it. That is on initial load of the page
    renderUserCountElement();
  }
  $('#epCitizenOSUserListToggleCount').text(count);
};

/**
 * Render the User list
 *
 * @param {Array<Object>} userList Array of User objects
 *
 * @returns {void}
 */
const renderUserList = (userList) => {
  const $epCitizenOSUserList = $('#epCitizenOSUserList');
  const colorPalette = clientVars.colorPalette; // colorId is index of the actual color code

  let list = '<ul class="popup-content">';
  let countAnonymous = 0;

  userList.forEach((user) => {
    if (user.name) {
      let li;
      let color = colorPalette[user.colorId];

      if (!color) { // Did not find from palette, so it's not a palette color
        // Cast to string
        color = String(user.colorId);
        // See if it looks like a color code, if not, don't use it
        if (!color.match(/^#[0-9a-f]{3,6}$/i)) {
          color = null;
        }
      }

      if (user.userId === clientVars.userId) { // Current user
        li = '<li class="epCitizenOSUserListCurrent">';
        if (color) {
          li += `<span class="swatchBox" style="background-color: ${color}"></span>`;
        }
        li += `<span class="epCitizenOSUserListUserName">${padutils.escapeHtml(user.name)}</span>`;
        li += '</li>';
        list += li; // "prepend"
      } else {
        li = '<li>';
        if (color) {
          li += `<span class="swatchBox" style="background-color: ${color}"></span>`;
        }
        li += `<span class="epCitizenOSUserListUserName">${padutils.escapeHtml(user.name)}</span>`;
        li += '</li>';
        list += li; // Add as first in the list
      }
    } else {
      countAnonymous++;
    }
  });

  list += `<li class="epCitizenOSUserListAnonymous">
  ${window._('epCitizenOSUserList.userList.text.anonymous', {count: countAnonymous})}
  </li>`;
  list += '</ul>';

  $epCitizenOSUserList.html(list);
};

/**
 * postToolbarInit hook
 *
 * Registers the epCitizenOSUserListToggle command to the toolbar.
 *
 * @param {string} hookName "postToolbarInit"
 * @param {object} args {ace: .., toolbar: ..}
 *
 * @returns {void}
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_posttoolbarinit}
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_editbar}
 */
exports.postToolbarInit = (hookName, args) => {
  const editbar = args.toolbar; // toolbar is actually editbar - http://etherpad.org/doc/v1.5.7/#index_editbar
  const $epCitizenOSUserList = $('#epCitizenOSUserList');

  // We don't want to overwrite the count if it is populated by the "userJoinOrUpdate" hook
  if (!isUserCountElement()) {
    renderUserCountElement();
  }

  editbar.registerCommand('epCitizenOSUserListToggle', () => {
    const isVisibleUserList = $epCitizenOSUserList.is(':visible');
    if (isVisibleUserList) {
      $epCitizenOSUserList.hide();
      $epCitizenOSUserList.removeClass('popup-show');
    } else {
      renderUserList(paduserlist.usersOnline());
      $epCitizenOSUserList.show();
      $epCitizenOSUserList.addClass('popup-show');
    }
  });
};

/**
 * userJoinOrUpdate hook
 *
 * @param {string} hookName "userJoinOrUpdate"
 * @param {object} args {userInfo}
 *
 * @returns {void}
 */
exports.userJoinOrUpdate = (hookName, args) => {
  const $epCitizenOSUserList = $('#epCitizenOSUserList');
  let usersOnline = paduserlist.usersOnline();
  let existingUser;

  usersOnline.some((user) => {
    if (user.userId === args.userInfo.userId) {
      existingUser = user;

      return true; // break
    }

    return false;
  });

  if (!existingUser) {
    // usersOnline does not return the user just joined when "userJoinOrUpdate" is triggered!
    usersOnline = [args.userInfo].concat(usersOnline);
  }

  renderUserCount(usersOnline.length);

  if ($epCitizenOSUserList.is(':visible')) {
    renderUserList(usersOnline);
  }
};

/**
 * userLeave hook
 *
 * NOTE: userLeave hook is delayed 8 sec from the moment user actually leaves
 *
 * @returns {void}
 */
exports.userLeave = () => {
  const $epCitizenOSUserList = $('#epCitizenOSUserList');
  const usersOnline = paduserlist.usersOnline();

  renderUserCount(usersOnline.length);

  if ($epCitizenOSUserList.is(':visible')) {
    renderUserList(usersOnline);
  }
};
