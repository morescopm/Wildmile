import User from '../../models/User'
import getAvatar from '../avatar'

export async function getAllUsers() {
  // For demo purpose only. You are not likely to have to return all users.
  const users = await User.find({}, ['-_id', 'email', 'admin', 'ranger', 'profile'])
  return users
}

export async function createUser({ name, email, password, website, gender, location, picture = null}) {
  // Here you should create the user and save the salt and hashed password (some dbs may have
  // authentication methods that will do it for you so you don't have to worry about it):

  if(!picture){
    picture = getAvatar(name)
  }
  // Here you should insert the user into the database
  const user = await User.create({
    email: email,
    password: password,
    profile: {
      name: name,
      website: website,
      gender: gender,
      location: location,
      picture: picture
    }
  })
  return user
}

export async function findUserByEmail(email) {
  // Here you find the user based on id/email in the database
  return await User.findOne({ email: email.toLowerCase() }, ['-_id', '-__v', '-createdAt', '-updatedAt'])
}

export async function updateUserByEmail(req, email, update) {
  // Updating requires the _id which we filter out of results in other places so lets 
  const user = await User.findOne({ email: email.toLowerCase() })

  if(update.email && update.email != user.email){
    user.email = update.email
  }
  if(update.password && !await user.comparePassword(password)){
    user.password = update.password
  }
  if (user) {
    // Not all users have default values set so at least have empty values rather than null ones
    const profile_props = {
      name: '',
      website: '',
      gender: '',
      location: '',
      picture: ''
    }
    user.profile = {...profile_props, ...user.profile, ...update.profile}
    await user.save()
  }
  return user
}
