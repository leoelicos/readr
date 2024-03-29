import React, { useState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { useMutation } from '@apollo/client'
import { ADD_USER } from '../utils/mutations'
import Auth from '../utils/auth'

const SignupForm = () => {
  /* user form data */
  const [userFormData, setUserFormData] = useState({ username: '', email: '', password: '' })

  /* validated */
  const [validated] = useState(false)

  /* show alert */
  const [showAlert, setShowAlert] = useState(false)

  /* add user */
  const [addUser] = useMutation(ADD_USER)

  /* user form data */
  const handleInputChange = (event) => {
    const { name, value } = event.target
    setUserFormData({ ...userFormData, [name]: value })
  }

  /* add user, show alert, user form data */
  const handleFormSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    }

    try {
      const { data } = await addUser({
        variables: { ...userFormData }
      })

      data && Auth.login(data.addUser.token)
    } catch (err) {
      console.error(err)
      setShowAlert(true)
    }

    setUserFormData({
      username: '',
      email: '',
      password: ''
    })
  }

  return (
    <>
      {/* form */}
      <Form
        noValidate
        validated={validated}
        onSubmit={handleFormSubmit}>
        {/* alert */}
        <Alert
          dismissible
          onClose={() => setShowAlert(false)}
          show={showAlert}
          variant='danger'>
          Something went wrong with your signup!
        </Alert>

        {/* username */}
        <Form.Group>
          <Form.Label htmlFor='username'>Username</Form.Label>
          <Form.Control
            type='text'
            placeholder='Your username'
            name='username'
            onChange={handleInputChange}
            value={userFormData.username}
            required
          />
          <Form.Control.Feedback type='invalid'>Username is required!</Form.Control.Feedback>
        </Form.Group>

        {/* email */}
        <Form.Group>
          <Form.Label htmlFor='email'>Email</Form.Label>
          <Form.Control
            type='email'
            placeholder='Your email address'
            name='email'
            onChange={handleInputChange}
            value={userFormData.email}
            required
          />
          <Form.Control.Feedback type='invalid'>Email is required!</Form.Control.Feedback>
        </Form.Group>

        {/* password */}
        <Form.Group>
          <Form.Label htmlFor='password'>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Your password'
            name='password'
            onChange={handleInputChange}
            value={userFormData.password}
            required
          />
          <Form.Control.Feedback type='invalid'>Password is required!</Form.Control.Feedback>
        </Form.Group>

        {/* submit button */}
        <Button
          disabled={!(userFormData.username && userFormData.email && userFormData.password)}
          type='submit'
          variant='success'>
          Submit
        </Button>
      </Form>
    </>
  )
}

export default SignupForm
