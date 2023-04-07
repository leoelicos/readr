import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar, Nav, Container, Modal, Tab } from 'react-bootstrap'
import SignUpForm from './SignupForm'
import LoginForm from './LoginForm'
import Auth from '../utils/auth'

const AppNavbar = () => {
  // show modal
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {/* navbar */}
      <Navbar
        bg='dark'
        variant='dark'
        expand='lg'>
        <Container fluid>
          {/* logo */}
          <Navbar.Brand
            as={Link}
            to='/'>
            Readr
          </Navbar.Brand>
          {/* button to open and close hamburger menu */}
          <Navbar.Toggle aria-controls='navbar' />
          {/* menu items */}
          <Navbar.Collapse id='navbar'>
            <Nav className='ml-auto'>
              <Nav.Link
                as={Link}
                to='/'>
                Search For Books
              </Nav.Link>
              {Auth.loggedIn() ? (
                <>
                  <Nav.Link
                    as={Link}
                    to='/saved'>
                    See Your Books
                  </Nav.Link>
                  <Nav.Link onClick={Auth.logout}>Logout</Nav.Link>
                </>
              ) : (
                <Nav.Link onClick={() => setShowModal(true)}>Login/Sign Up</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* modal containing login and signup forms */}
      <Modal
        size='lg'
        show={showModal}
        onHide={() => setShowModal(false)}
        aria-labelledby='signup-modal'>
        <Tab.Container defaultActiveKey='login'>
          <Modal.Header closeButton>
            <Modal.Title id='signup-modal'>
              <Nav variant='pills'>
                <Nav.Item>
                  <Nav.Link eventKey='login'>Login</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey='signup'>Sign Up</Nav.Link>
                </Nav.Item>
              </Nav>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tab.Content>
              <Tab.Pane eventKey='login'>
                <LoginForm handleModalClose={() => setShowModal(false)} />
              </Tab.Pane>
              <Tab.Pane eventKey='signup'>
                <SignUpForm handleModalClose={() => setShowModal(false)} />
              </Tab.Pane>
            </Tab.Content>
          </Modal.Body>
        </Tab.Container>
      </Modal>
    </>
  )
}

export default AppNavbar
