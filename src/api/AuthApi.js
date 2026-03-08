import axios from "axios";
import { BaseURL, MainURL, PrivateAxios } from "./AxisoInstance"

export const LoginUser = async (payload) => {
  try {
    const response = await PrivateAxios.post("Backoffice/UserGet", {
      userEmail: payload.email,
      userPassword: payload.password,
      userId: "",
      searchKeyword: "",
    });

    return response.data;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    throw error;
  }
};

export const OTPSend = async (payload) => {
  try {
    const response = await axios.post(
      `${BaseURL}Auth/send-otp`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};

export const MatchOTP = async (payload) => {
  try {
    const response = await axios.post(
      `${BaseURL}Auth/verify-otp`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};

export const CheckUser = async (payload) => {
  try {
    const response = await axios.post(
      `${BaseURL}DesignBoard/CheckCustomerUserName`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};

export const SubUserCreate = async (payload) => {
  try {
    const response = await axios.post(
      `${BaseURL}DesignBoard/CreateCompanyAndCustomer`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};


export const RegisterUser = async (payload) => {
  try {
    const response = await axios.post(
      `${MainURL}api/api/Auth/send-otp`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};

export const CreateNewUser = async (payload) => {
  try {
    const response = await PrivateAxios.post(
      `DesignBoard/CreateCompanyAndCustomer`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};


//==============Sub user Creation =================//
export const getUserList = async (payload) => {
  try {
    const response = await PrivateAxios.post(
      `Backoffice/UserGet`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};


export const getUserBoard = async (payload) => {
  try {
    const response = await PrivateAxios.post(
      `DesignBoard/GetPaymentAccountLinkDetailsByUserName`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
};

export const ActiveInactiveBoard = async(payload) => {
  try {
    const response = await PrivateAxios.post(
      `DesignBoard/ActiveInActiveBoardBasedonPayment`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
}


export const AutoRefreshData = async(payload) => {
  try {
    const response = await PrivateAxios.post(
      `DesignBoard/CallPublish`, payload
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching board data:", error);
    throw error;
  }
}


export const GetPOSData = async (payload) => {
    try {
        const response = await PrivateAxios.post(
            "DesignBoard/GetPosItemList",
            payload
        );
        return response.data;
    }
    catch (error) {
        console.error("Error fetching board data:", error);
        throw error;
    }
};