import React, { useState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { useMutation } from '@apollo/client'
import { LOGIN } from '../utils/mutations'
import Auth from '../utils/auth'

const LoginForm = () => {
  /* user form data */
  const [userFormData, setUserFormData] = useState({ email: '', password: '' })

  /* validated */
  const [validated] = useState(false)

  /* show alert */
  const [showAlert, setShowAlert] = useState(false)

  /* login */
  const [login] = useMutation(LOGIN)

  /* user form data */
  const handleInputChange = (event) => {
    const { name, value } = event.target
    setUserFormData({
      ...userFormData,
      [name]: value
    })
  }

  /* login, show alert, user form data */
  const handleFormSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    }

    try {
      const { data } = await login({
        variables: { ...userFormData }
      })
      data && Auth.login(data.login.token)
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
        {/* conditional alert if error */}
        <Alert
          dismissible
          variant='danger'
          show={showAlert}
          onClose={() => setShowAlert(false)}>
          Something went wrong with your login credentials!
        </Alert>

        {/* email */}
        <Form.Group>
          <Form.Label htmlFor='email'>Email</Form.Label>
          <Form.Control
            type='text'
            placeholder='Your email'
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

        {/* submit form */}
        <Button
          disabled={!(userFormData.email && userFormData.password)}
          type='submit'
          variant='success'>
          Submit
        </Button>
      </Form>
    </>
  )
}

export default LoginForm
