import React, { useState, useRef, useCallback, useEffect } from 'react';
import Map from './components/Map';
import Search from './components/Search';
import CoordinateInput from './components/CoordinateInput';
import axios from 'axios';
import 'antd/dist/reset.css';
import Download from './components/download';
import ThreeMonthCalendar from './components/Calanderview';
import Dataa from './components/Date';
import NotificationSignupPage from './components/Form';
import SatelliteImageGallery from './components/databasmonth';
//-------------------------------------------------------------------------------------
const App = () => {
	const [isUserTyping, setIsUserTyping] = useState(false);
	const [showOlderNavBar, setShowOlderNavBar] = useState(true);
	const [showCanvas, setShowCanvas] = useState(false);
	const [activeTab, setActiveTab] = useState('AcquisitionDates');
	const [showNewNavBar, setShowNewNavBar] = useState(false);
	const [calendarData, setCalendarData] = useState([]);
	const startDateValue = new Date().toISOString().split('T')[0];
	const endDateValue = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
		.toISOString()
		.split('T')[0];
	const [endDate, setStartDateValue] = useState(startDateValue);
	const [startDate, setEndDateValue] = useState(endDateValue);

	const [center, setCenter] = useState([53.504, -0.0669]);
	const [zoom, setZoom] = useState(8);
	const [dates, setdates] = useState([]);
	const [wantData, setWantData] = useState(false);
	const [coordinates, setCoordinates] = useState({
		lat: '53.5040',
		lng: '-0.0669',
	});
	const [data, setData] = useState([]);
	const [selectedLocation, setSelectedLocation] = useState({
		coordinates: [53.504, -0.0669],
		displayName:
			'Cheapside, Cheapside Farm, Waltham, North East Lincolnshire, England, DN37 0FJ, United Kingdom',
	});
	const [selectedSatellites, setSelectedSatellites] = useState([]);
	const [searchQuery, setSearchQuery] = useState(
		'Cheapside, Cheapside Farm, Waltham, North East Lincolnshire, England, DN37 0FJ, United Kingdom'
	);
	const API_URL = 'http://localhost:5000';
	// const API_URL = 'https://sr-hub-backend.onrender.com';
	const mapRef = useRef();

	//-------------------------------------------------------------------------------------

	const fetchAcquisitionDates = async () => {
		console.log('Fetching acquisition dates...');

		try {
			const response = await axios.get(
				`${API_URL}/get-acquisition-dates?longitude=${coordinates.lng}&latitude=${coordinates.lat}`
			);
			console.log('Response received:', response);
			if (response.status === 200) {
				setdates(response.data);
			} else {
				console.log(`Unexpected response code: ${response.status}`);
			}
		} catch (error) {
			console.error('Error during fetch:', error);
		} finally {
			console.log('Finished fetching acquisition dates.'); // Stop loading regardless of the outcome
		}
	};
	//-------------------------------------------------------------------------------------

	const fetchData = async () => {
		try {
			const response = await axios.get(
				`${API_URL}/get-full-metadata?longitude=${coordinates.lng}&latitude=${coordinates.lat}&startDate=${startDate}&endDate=${endDate}`
			);
			const fetchedData = response.data;

			setData(fetchedData);

			const satelliteNames = [
				...new Set(fetchedData.map(item => item.satellite_name)),
			];
			setSelectedSatellites(satelliteNames);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};
	//-------------------------------------------------------------------------------------

	const handleCoordinatesChange = useCallback(() => {
		if (mapRef.current) {
			mapRef.current.flyTo([coordinates.lat, coordinates.lng], 8, {
				animate: true,
			});
		}
	}, [coordinates, mapRef]);
	//-------------------------------------------------------------------------------------

	const handleUserTyping = useCallback(isTyping => {
		setIsUserTyping(isTyping);
	}, []);
	//-------------------------------------------------------------------------------------
	const handleLocationChange = useCallback(
		async (coordinates, displayName) => {
			setSelectedLocation({ coordinates, displayName });

			setCoordinates({
				/* Resetting latitude and longitude here */
				lat: coordinates[0].toFixed(6),
				lng: coordinates[1].toFixed(6),
			});

			if (!displayName && !isUserTyping) {
				try {
					const response = await axios.get(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates[0]}&lon=${coordinates[1]}`
					);
					setSearchQuery(response.data.display_name);
				} catch (error) {
					console.error('Error in reverse geocoding:', error);
					setSearchQuery('');
				}
			} else {
				setSearchQuery(displayName);
			}
		},
		[isUserTyping]
	);
	//-------------------------------------------------------------------------------------
	const handleZoomChange = newZoom => {
		setZoom(newZoom);
	};
	//-------------------------------------------------------------------------------------

	const LocationInfoBar = ({ locationName, coordinates }) => (
		<div
			className="backdrop-blur-md bg-white/40 text-black flex items-center justify-center p-2 h-12 shadow-lg rounded-full mx-6 mt-4"
			style={{ width: 'calc(100% - 3rem)' }}>
			<p className="text-lg font-semibold">
				You have locked your location to {locationName} (
				{parseFloat(coordinates.lat).toFixed(4)},{' '}
				{parseFloat(coordinates.lng).toFixed(4)})
			</p>
		</div>
	);
	//-------------------------------------------------------------------------------------
	useEffect(() => {
		handleCoordinatesChange();
	}, [handleCoordinatesChange]);
	//-------------------------------------------------------------------------------------
	return (
		<div className="relative flex flex-col h-screen">
			{showOlderNavBar && (
				<nav className="absolute inset-x-0 top-0 z-20 backdrop-blur-sm bg-white/30 text-black flex items-center justify-between p-4 h-16 shadow-md rounded-3xl mt-3 mx-5">
					<h1 className="text-2xl ml-4 font-bold">SR-HUB</h1>
					<div className="flex items-center gap-x-4">
						<Search
							onLocationSelected={handleLocationChange}
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
							onUserTyping={handleUserTyping}
						/>
						<CoordinateInput
							onCoordinatesChanged={handleLocationChange}
							coordinates={coordinates}
							setCoordinates={setCoordinates}
						/>
					</div>
					<button
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
						onClick={() => {
							setShowOlderNavBar(false);
							setShowCanvas(true);
							setShowNewNavBar(false);
							fetchAcquisitionDates();
							setdates([]);
							setData([]);
							setSelectedSatellites([]);
						}}>
						Lock This Location
					</button>
				</nav>
			)}

			{showCanvas && (
				<div
					className="absolute inset-0 z-30 backdrop-blur-md flex flex-col items-center justify-start overflow-auto"
					style={{ maxHeight: '100vh' }}>
					{showNewNavBar && (
						<nav
							className="backdrop-blur-md bg-white/40 text-black flex items-center justify-between p-4 h-16 shadow-lg rounded-full mt-4 mx-6"
							style={{ width: 'calc(100% - 3rem)' }}>
							<h1 className="text-2xl ml-4 font-bold tracking-wide">
								SR-HUB
							</h1>
							<div className="flex items-center gap-x-4">
								<button
									className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md ${
										activeTab === 'AcquisitionDates'
											? 'bg-blue-700'
											: ''
									}`}
									onClick={() =>
										setActiveTab('AcquisitionDates')
									}>
									Turn On Notifications
								</button>
								<button
									className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md ${
										activeTab === 'gallery'
											? 'bg-blue-700'
											: ''
									}`}
									onClick={() => setActiveTab('gallery')}>
									1 Month Database
								</button>
								<button
									className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md ${
										activeTab === 'SatelliteCalendar'
											? 'bg-blue-700'
											: ''
									}`}
									onClick={() =>
										setActiveTab('SatelliteCalendar')
									}>
									Overpass Calendar
								</button>
								<button
									className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md ${
										activeTab === 'Date'
											? 'bg-blue-700'
											: ''
									}`}
									onClick={() => setActiveTab('Dataa')}>
									Data
								</button>
							</div>
							<button
								className={`${
									wantData && data.length === 0
										? 'bg-red-600 hover:bg-red-700'
										: 'bg-blue-600 hover:bg-blue-700'
								} text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md`}
								onClick={() => {
									setShowOlderNavBar(true);
									setShowCanvas(false);
									setShowNewNavBar(false);
								}}
								disabled={wantData && data.length === 0}>
								{wantData && data.length === 0
									? 'Wait till Data is received'
									: 'Change Location'}
							</button>
						</nav>
					)}

					{/* Location Info Bar */}
					<LocationInfoBar
						locationName={selectedLocation.displayName}
						coordinates={coordinates}
					/>

					<div
						className="backdrop-blur-md bg-white/40 text-black p-6 overflow-y-auto rounded-3xl w-[calc(100vw-6rem)] shadow-xl transition-all duration-300 mt-4"
						style={{
							flexGrow: 1,
						}}>
						{showNewNavBar ? (
							<>
								{activeTab === 'AcquisitionDates' && (
									<NotificationSignupPage />
								)}
								{activeTab === 'SatelliteCalendar' && (
									<ThreeMonthCalendar dates={dates} />
								)}
								{activeTab === 'Dataa' && <Dataa />}
								{activeTab === 'gallery' && (
									<>
										<div className="relative">
											{/* Full screen overlay */}
											{!wantData && (
												<div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col justify-center items-center z-50">
													<p className="mt-4 text-2xl text-center max-w-md font-bold">
														PLEASE BE AWARE THAT
														GENERATING DATA WILL
														TAKE AROUND 5 MINUTES
														AND YOU WON'T BE ABLE TO
														CHANGE THE LOCATION
														UNTIL THE SERVER
														RECEIVES THE DATA.
													</p>
													<button
														className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-md"
														onClick={() => {
															fetchData();
															setWantData(true);
														}}>
														Generate Data
													</button>
												</div>
											)}
											{/* Your normal content goes here */}
											<div className="flex items-center mb-4">
												{/* Other content */}
											</div>
										</div>

										<SatelliteImageGallery
											data={data}
											selectedSatellites={
												selectedSatellites
											}
										/>
									</>
								)}
							</>
						) : (
							<>
								<div className="download-component bg-white p-6 rounded-lg shadow-lg">
									<h2 className="text-2xl font-semibold mb-4">
										Download Options
									</h2>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<button
											onClick={() =>
												fetchAcquisitionDates()
											}
											className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center">
											Generate Prediction Calendar
										</button>

										<button className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center">
											Last Data of All Satellites
										</button>

										<button className="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 flex items-center justify-center">
											Generate 1-Month Dataset
										</button>

										<button className="bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 flex items-center justify-center">
											Generate Custom Dataset
										</button>
									</div>
								</div>
								<button
									className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md mt-4"
									onClick={() => {
										setShowNewNavBar(true);
										setActiveTab('SatelliteCalendar'); // or any default tab
									}}>
									Access the SR Haven
								</button>
							</>
						)}
					</div>
				</div>
			)}

			<div className="flex-grow relative z-10">
				<Map
					center={center}
					zoom={zoom}
					ref={mapRef}
					selectedLocation={selectedLocation}
					onLocationChange={handleLocationChange}
					onZoomChange={handleZoomChange}
				/>
			</div>
		</div>
	);
};

export default App;
