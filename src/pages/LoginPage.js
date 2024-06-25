import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from '../utils/FirebaseConfig';
import { saveUser } from '../utils/userSlice';
import { useDispatch } from 'react-redux';
import logger from '../utils/logger';

const LoginPage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            const { user } = result;
            if (user) {
                const userRef = firebase.firestore().collection('users').doc(user.uid);
                const userDoc = await userRef.get();
                logger('Fetching firebase user');
                if (userDoc.exists) {
                    logger('Routing to home');
                    const userData = userDoc.data();
                    localStorage.setItem('user', JSON.stringify({ user: user.uid, email: user.email, photo: user.photoURL, name: user.displayName, ...userData }));
                    const expertise = userData.piano_expertise
                    if (expertise === "") {
                        logger('User piano_expertise is empty, routing to level selector');
                        navigate('/levelselector');
                    } else {
                        if (expertise === "NOVICE"){
                            navigate('/tutorial');
                        }
                    }

                } else {
                    console.log('🐧 Simpu: User does not exist, creating firestore document');
                    const newUser = {
                        piano_expertise: "",
                        email: user.email,
                        photo: user.photoURL,
                        name: user.displayName
                    };
                    await userRef.set(newUser, { merge: true });
                    const userDoc = await userRef.get();
                    const userData = userDoc.data()
                    localStorage.setItem('user', JSON.stringify({ user: user.uid, email: user.email, photo: user.photoURL, name: user.displayName, ...userData }));
                    navigate('/levelselector');
                }
                
            }
        } catch (error) {
            logger(error, "error");
        }
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center" id="content">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <div className="flex flex-col items-center mb-5">
                            <img className="w-45 h-40" src="/simpu-waving.png" alt="logo" />
                            <span className="text-lg font-birdgo text-gray-500 mt-4">
                                Your guide to piano learning journey!
                            </span>
                        </div>
                        <div className="flex flex-col items-center space-y-4">
                            <input
                                type="text"
                                id="username"
                                aria-describedby="username-explanation"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Username"
                            />
                            <input
                                type="password"
                                id="password"
                                aria-describedby="password-explanation"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Password"
                            />
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                className="w-full bg-gray-500 text-white border hover:bg-white hover:text-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                            >
                                SIGN IN
                            </button>
                        </div>
                        <div className="inline-flex items-center justify-center w-full">
                            <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
                            <span className="absolute px-3 font-medium text-gray-500 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">or</span>
                        </div>
                        <form className="space-y-4 md:space-y-6" action="#">
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                className="w-full bg-white text-gray-500 border hover:bg-white hover:text-gray-500 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                            >
                                <svg
                                    className="w-6 h-5 me-2 -ms-1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    x="0px"
                                    y="0px"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 48 48"
                                >
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                                </svg>
                                SIGN IN WITH GOOGLE
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LoginPage;
