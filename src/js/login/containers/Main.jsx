import React from 'react';
import { connect } from 'react-redux';
import $ from 'jquery';

import environment from '../../common/helpers/environment.js';
import { getUserData } from '../../common/helpers/login-helpers';

import { updateLoggedInStatus, updateLogInUrl, logOut } from '../../common/actions';
import SignInProfileButton from '../components/SignInProfileButton';

// TODO(crew): Redux-ify the state and how it is stored here.
class Main extends React.Component {
  constructor(props) {
    super(props);
    this.setMyToken = this.setMyToken.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.getUserData = getUserData;
  }

  componentDidMount() {
    if (localStorage.userToken) {
      this.props.onUpdateLoggedInStatus(true);
      this.getUserData();
    } else {
      this.props.onUpdateLoggedInStatus(false);
    }

    // TODO(crew): Remove this conditional statement when going to production.
    if (__BUILDTYPE__ !== 'production') {
      this.serverRequest = $.get(`${environment.API_URL}/v0/sessions/new?level=1`, result => {
        this.props.onUpdateLoginUrl('first', result.authenticate_via_get);
      });

      this.serverRequest = $.get(`${environment.API_URL}/v0/sessions/new?level=3`, result => {
        this.props.onUpdateLoginUrl('third', result.authenticate_via_get);
      });
    }

    window.addEventListener('message', this.setMyToken);
  }

  componentWillUnmount() {
    this.serverRequest.abort();
  }

  setMyToken() {
    if (event.data === localStorage.userToken) {
      this.getUserData();
    }
  }

  handleLogin() {
    const myLoginUrl = this.props.login.loginUrl.first;
    const receiver = window.open(myLoginUrl, '_blank', 'resizable=yes,scrollbars=1,top=50,left=500,width=500,height=750');
    receiver.focus();
  }

  handleLogout() {
    // localStorage.removeItem('userToken');
    // this.props.onUpdateLoggedInStatus(false);
    // this.props.onClearUserData();
    // location.reload();
    fetch(`${environment.API_URL}/v0/sessions`, {
      method: 'delete',
      headers: new Headers({
        Authorization: `Token token=${localStorage.userToken}`
      })
    }).then(response => {
      return response.json();
    }).then(json => {
      // console.log(json);
      const myLogoutUrl = json.logout_via_get;
      const receiver = window.open(myLogoutUrl, '_blank', 'resizable=yes,scrollbars=1,top=50,left=500,width=500,height=750');
      receiver.focus();
    });
  }

  render() {
    let content;

    if (__BUILDTYPE__ !== 'production') {
      content = (
        <SignInProfileButton onUserLogin={this.handleLogin} onUserLogout={this.handleLogout}/>
      );
    } else {
      content = null;
    }
    return content;
  }
}

const mapStateToProps = (state) => {
  return {
    login: state.login,
    profile: state.profile
  };
};


const mapDispatchToProps = (dispatch) => {
  return {
    onUpdateLoginUrl: (field, update) => {
      dispatch(updateLogInUrl(field, update));
    },
    onUpdateLoggedInStatus: (update) => {
      dispatch(updateLoggedInStatus(update));
    },
    onClearUserData: () => {
      dispatch(logOut());
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps, undefined, { pure: false })(Main);
export { Main };
