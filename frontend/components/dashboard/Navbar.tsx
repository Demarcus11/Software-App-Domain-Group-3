"use client";
import Image from "next/image";
import Link from "next/link";
import logo from "@/img/logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UserProfile {
  firstName: string;
  lastName: string;
  profilePicture: string;
  username: string;
  email: string;
  roleId: string;
  id: string;
}

const Navbar = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  const handleLogoutButtonClick = async () => {
    localStorage.removeItem("jwt");
    router.push("/login");
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("jwt");

        if (!token) {
          console.log("No token");
        }

        const res = await fetch("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const error = await res.json();
          console.log(error);
          return;
        }

        const userProfile = await res.json();
        setUserProfile(userProfile);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUserProfile();
  }, []);

  const userInitials = userProfile
    ? `${userProfile.firstName[0]}${userProfile.lastName[0]}`
    : "N/A";

  return (
    <nav className="bg-primary dark:bg-slate-700 text-white py-2 px-10 flex justify-between">
      <Link href="/" className="flex gap-2 items-center">
        <Image src={logo} alt="AccuBooks" width={50} />
        <p>AccuBooks</p>
      </Link>

      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2">
            <p>{`${userProfile?.firstName} ${userProfile?.lastName}`}</p>
            <Avatar>
              <AvatarImage
                src={userProfile?.profilePicture}
                alt={`${userProfile?.firstName} ${userProfile?.lastName}`}
              />
              <AvatarFallback className="text-black">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button className="bg-transparent text-primary hover:bg-transparent shadow-none py-1.5 block px-2">
                Profile
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Button
                className="bg-transparent text-primary hover:bg-transparent shadow-none py-1.5 block px-2"
                onClick={handleLogoutButtonClick}
              >
                Logout
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
