import React, {Component} from 'react';
import Particles from 'react-particles-js';
import Navigation from './components/navigation/Navigation';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Signin from './components/Signin/Signin';
import Logo from './components/Logo/Logo';
import Register from './components/Register/Register';
import Rank from './components/Rank/Rank';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import './App.css';
import Clarifai from 'clarifai';


const app = new Clarifai.App({
  apiKey: '8a10f9be33c345b8b3f72a5c73ba916f'
});

const particlesOptions = {
  particles: {
    number: {
      value: 150,
      density: {
        enable: true,
        value_area: 2500
      }
    }
  }
}

const initialState = {
  input:'',
  imageUrl: '',
  boxes: [],
  route: 'Signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}
class App extends Component {

  constructor() {
    super();
    this.state = initialState;
  }

  
  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }
/**************** We change this part for the reason of multi face detection */
  /*caculateFaceLocation = (data) => {
    const clarifaiFace =  data.outputs[0].data.regions[0].region_info.bounding_box
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }*/

  // these lines of the code are exactlly ass above just for multi face detection created
  caculateFaceLocations = (data) => {
    return  data.outputs[0].data.regions.map(face => {
      const clarifaiFace =  face.region_info.bounding_box;
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);
      return {
        leftCol: clarifaiFace.left_col * width,
        topRow: clarifaiFace.top_row * height,
        rightCol: width - (clarifaiFace.right_col * width),
        bottomRow: height - (clarifaiFace.bottom_row * height)
      }
    });
  }

  displayFaceBoxes = (boxes) => {
    console.log(boxes);
    this.setState({boxes: boxes});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
      // fetch('https://stark-forest-78177.herokuapp.com/imageurl', {
      //   method: 'post',
      //   headers: {'Content-Type': 'application/json'},
      //   body: JSON.stringify({
      //     input: this.state.input
      //   })
      // })
      // .then(response => response.json())
      // .then(response => {
      //   if (response) {
      //     fetch('https://stark-forest-78177.herokuapp.com/image', {
      //       method: 'put',
      //       headers: {'Content-Type': 'application/json'},
      //       body: JSON.stringify({
      //         id: this.state.user.id
      //       })
      //     })
      //     .then(response => response.json())
      //     .then(count => {
      //       this.setState(Object.assign(this.state.user, {entries: count}))
      //     })
      //     .catch(console.log)
      //   }
      //   this.displayFaceBox(this.caculateFaceLocation(response))
      // })
      app.models.predict(
        Clarifai.FACE_DETECT_MODEL, 
        this.state.input)
        .then(response => {
          if (response) {
            fetch('http://localhost:3000/image', {
              method: 'put',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                id: this.state.user.id
              })
            })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, {entries: count}))
            })
            .catch(console.log)
          }
          this.displayFaceBoxes(this.caculateFaceLocations(response))
        })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if(route === 'signout'){
      this.setState(initialState)
    }else if (route === 'home'){
      this.setState({isSignedIn: true})
    }
    this.setState({route: route})
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes } = this.state;
    return (
      <div className="App">
        <Particles className='particles' 
          params={particlesOptions}
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange = {this.onRouteChange}/>
        { route === 'home'
          ? <div>
          <Logo />
          <Rank name={this.state.user.name} 
          entries={this.state.user.entries}/>
          <ImageLinkForm 
          onInputChange = {this.onInputChange } 
          onButtonSubmit = {this.onButtonSubmit}/> 
          {/* Remember that because it's part of this class to access it, you 
          need to save 'this.onInputChange'
          because 'onInputChange' is a property of the 'App' class.*/}
          <FaceRecognition boxes={boxes} imageUrl = {imageUrl}/>
          </div>
          : (
            route === 'Signin'
            ? <Signin loadUser= {this.loadUser} onRouteChange={this.onRouteChange}/>
            : <Register loadUser= {this.loadUser} onRouteChange={this.onRouteChange}/>
            )
        }
      </div>
    );
  }
}

export default App;
